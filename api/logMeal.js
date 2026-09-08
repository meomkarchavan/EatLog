import { GoogleGenerativeAI } from "@google/generative-ai";
import { getApiKey, extractAndParseJSON, CANDIDATE_MODELS } from "./_geminiUtils.js";

const SYSTEM_INSTRUCTION = `You are the world's most precise Indian nutrition engine, calibrated to ICMR-NIN (National Institute of Nutrition) and IFCT standards. Your task is to extract exact nutritional estimates from food images and natural language text across home-cooked, street, and restaurant Indian meals.

CORE NUTRITIONAL HEURISTICS & BENCHMARKS:
1. HIDDEN COOKING FATS (MANDATORY ADJUSTMENT):
   - Home-cooked style: Estimate 5-7g cooking oil/ghee per single katori (150ml) of sabzi or dal.
   - Restaurant / Dhabha / Rich gravies (Makhani, Butter Masala, Korma): Estimate 15-25g butter/cream/oil per serving.
   - Deep-fried items (Puri, Bhature, Samosa, Pakora): Account for 20-30% fat absorption by weight.

2. STANDARD REGIONAL PORTION SIZING:
   - 1 Standard Phulka/Roti (wheat, ~30g dry atta): ~80 kcal, 2.5g P, 17g C, 0.5g F.
   - Smeared Ghee (Ghee-chupdi roti): Add +45 kcal, +5g F per roti.
   - 1 Standard Paratha (shallow-fried): ~180-230 kcal, 4g P, 24g C, 9-12g F. (Stuffed Paneer/Aloo: 240-320 kcal).
   - 1 Katori/Vati (standard home bowl, ~150ml / 150g):
     * Cooked White/Brown Rice: ~180-200 kcal, 4g P, 40-44g C, 0.5g F.
     * Dal (Arhar/Toor, Moong, Masoor): ~130-160 kcal, 6-8g P, 18-22g C, 4-6g F (including tadka).
     * Dry Vegetable Sabzi (Bhindi, Aloo Gobi): ~120-170 kcal, 2-4g P, 12-16g C, 7-10g F.
     * Paneer Sabzi (Matar/Kadhai): ~280-350 kcal, 12-15g P, 10-14g C, 20-25g F.
   - 1 Jodi Pav (2 buns, ~60g): ~170 kcal, 5g P, 32g C, 2g F.
   - Chai (regular Indian cutting tea with whole milk + 1 tsp sugar, 100-120ml): ~80-110 kcal, 2.5g P, 11g C, 3.5g F.

3. MULTIMODAL VISION RECOGNITION PIPELINE:
   - Identify plate topography relative to a standard 10-inch thali plate or standard 150ml katoris.
   - Observe surface sheen/oil film to distinguish between steamed/boiled vs. tadka vs. deep-fried.
   - Differentiate paneer from tofu or boiled potato cubes based on texture, browning edges, and sauce integration.
   - If food packaging or a nutrition label is detected, override all heuristics and extract the exact serving values printed.

RULES:
1. STRICT JSON ONLY: Output ONLY valid, parsable raw JSON. Do not include markdown code blocks, backticks, or preamble.
2. ROUNDING: Round all macro gram and calorie values to integers.
3. OUTPUT SCHEMA:
{
  "food_summary": "Concise plain-text string describing all detected items and portions",
  "items": [
    {
      "name": "Item name with preparation style",
      "quantity": "Detected/estimated portion size",
      "calories": integer,
      "protein_g": integer,
      "carbs_g": integer,
      "fat_g": integer,
      "fiber_g": integer
    }
  ],
  "calories": integer,
  "protein_g": integer,
  "carbs_g": integer,
  "fat_g": integer,
  "fiber_g": integer,
  "cooking_fat_assumed": "Brief note on assumed oil/ghee (e.g., 'Home-style moderate ghee: ~12g')",
  "is_valid": boolean,
  "error_message": string or null
}`;


export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { text, image } = req.body;

  if (!text && !image) {
    return res.status(400).json({ error: "Request must include 'text' or 'image'" });
  }

  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // Build the prompt parts
    const parts = [];
    if (image) {
      parts.push(
        { inlineData: { mimeType: "image/jpeg", data: image } },
        { text: text || "Inspect this food image carefully. Identify all Indian regional dishes, side accompaniments (salads, chutneys, papad), volumetric portion sizes against standard katoris or dinner plates, and oil/ghee sheen. Return the calculated nutritional profile." }
      );
    } else {
      parts.push({ text: `Analyze this meal and calculate macros according to Indian nutritional standards: "${text}"` });
    }

    let response = null;
    let lastError = null;

    // Try candidate models in order with automatic fallback on 429, 404, or 503
    for (const modelName of CANDIDATE_MODELS) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: SYSTEM_INSTRUCTION,
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.1,
          },
        });

        const result = await model.generateContent(parts);
        response = result.response;
        if (response) {
          console.log(`[Gemini API] Successfully analyzed with model: ${modelName}`);
          break;
        }
      } catch (err) {
        console.warn(`[Gemini API] Model ${modelName} failed with:`, err.status || err.message);
        lastError = err;
        // If 429 (quota exceeded), 404 (not found), or 503 (high demand), try next candidate
        if (err.status === 429 || err.status === 404 || err.status === 503 || err.message?.includes("quota") || err.message?.includes("429")) {
          continue;
        } else {
          throw err;
        }
      }
    }

    if (!response) {
      throw lastError || new Error("All Gemini candidate models failed to generate content.");
    }

    const rawText = response.text();
    const parsed = extractAndParseJSON(rawText);

    // Ensure fallback fields exist; new fields (items, cooking_fat_assumed) are passed through
    return res.status(200).json({
      food_summary: parsed.food_summary || text || "Food",
      items: Array.isArray(parsed.items) ? parsed.items : [],
      calories: Number(parsed.calories) || 0,
      protein_g: Number(parsed.protein_g) || 0,
      carbs_g: Number(parsed.carbs_g) || 0,
      fat_g: Number(parsed.fat_g) || 0,
      fiber_g: Number(parsed.fiber_g) || 0,
      cooking_fat_assumed: parsed.cooking_fat_assumed || null,
      is_valid: parsed.is_valid !== false,
      error_message: parsed.error_message || null,
    });
  } catch (error) {
    console.error("Gemini API error:", error);

    const isQuotaError = error.status === 429 || error.message?.includes("quota") || error.message?.includes("429");

    return res.status(500).json({
      food_summary: null,
      calories: 0,
      protein_g: 0,
      carbs_g: 0,
      fat_g: 0,
      fiber_g: 0,
      is_valid: false,
      error_message: isQuotaError
        ? "Gemini API rate limit reached. Please try again in a few seconds."
        : error.message?.includes("high demand")
        ? "Gemini is currently experiencing high demand. Please retry in a moment."
        : error.message || "Failed to analyze meal",
    });
  }
}
