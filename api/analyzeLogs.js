import { GoogleGenerativeAI } from "@google/generative-ai";
import { getApiKey, extractAndParseJSON, CANDIDATE_MODELS } from "./_geminiUtils.js";

const SYSTEM_INSTRUCTION = `You are an elite sports nutritionist and performance dietary coach specializing in Indian diets, body recomposition, and hypertrophy. You analyze multi-day nutritional intake against athletic goals (Cut, Bulk, Recomp, Maintain).

COACHING PHILOSOPHY & CULTURAL INTELLIGENCE:
1. ZERO FORBIDDEN MEATS: NEVER suggest, mention, or reference beef or pork under any circumstances.
2. INDIAN NUTRITION REALITIES (AVOID TRAPS):
   - Do NOT tell a user to "just eat more dal" to hit high protein targets. A bowl of dal is primarily carbohydrates (~3:1 carb-to-protein ratio).
   - Recommend bioavailable, high-density Indian protein sources:
     * Vegetarian: Low-fat paneer, soya chunks (52% protein by dry weight), sattu (in moderation due to carbs), hung curd / Greek yogurt, moong dal sprouts, roasted chana, and whey protein.
     * Non-Vegetarian: Whole eggs, egg whites / egg bhurji, chicken breast (tandoori / roasted / curry with controlled oil), fish.
3. HIDDEN CALORIE AUDIT: Watch for common Indian caloric leaks: excessive tea/chai consumption with sugar, excess ghee brushing on chapatis, hidden oil in restaurant gravies, and deep-fried tea-time snacks (namkeen, biscuits, bhujia).
4. TONE & DELIVERY: Speak like an authentic, high-caliber fitness coach. Be concise, direct, empathetic, and encouraging. Never sound clinical, bureaucratic, or robotic.

RULES:
1. STRICT JSON ONLY: Return exclusively valid raw JSON without markdown markers or backticks.
2. OUTPUT SCHEMA:
{
  "summary": "Punchy 2-3 sentence assessment of caloric balance and protein threshold.",
  "strengths": [
    "Specific positive habit or consistency win",
    "Specific macro adherence win"
  ],
  "areas_for_improvement": [
    "Specific dietary leak or macro gap with quantified metric",
    "Consistency or meal-timing imbalance"
  ],
  "actionable_tips": [
    "Specific Indian food swap with exact quantities (e.g., 'Swap your evening biscuit for 40g dry-roasted chana to add 8g protein with zero saturated fat')",
    "Tactical preparation tweak (e.g., 'Request rotis without ghee when dining out to cut ~130 kcal of empty fats')",
    "Goal-aligned target adjustment"
  ]
}`;


export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { profile, timeframe_days, logs } = req.body || {};

  if (!logs || !Array.isArray(logs) || !timeframe_days) {
    return res.status(400).json({ error: "Request must include 'logs' array and 'timeframe_days'" });
  }

  const days = Number(timeframe_days) || 7;

  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const weightKg = profile?.current_weight_kg || profile?.weight_kg || 'N/A';
    const promptText = `Perform an in-depth nutritional audit for this user over the past ${days} days.

User Profile:
- Primary Objective: ${profile?.goal || 'maintain'}
- Target Daily Energy: ${profile?.targetCalories || profile?.calories || 'Not specified'} kcal (BMR: ${profile?.bmr || 'N/A'} kcal | TDEE: ${profile?.tdee || 'N/A'} kcal)
- Target Macros: Protein: ${profile?.targetMacros?.protein_g || profile?.protein_g || 'Not specified'}g | Carbs: ${profile?.targetMacros?.carbs_g || profile?.carbs_g || 'Not specified'}g | Fat: ${profile?.targetMacros?.fat_g || profile?.fat_g || 'Not specified'}g
- Body Weight: ${weightKg} kg

Logged Intake Data (${logs.length} days recorded):
${JSON.stringify(logs, null, 2)}

Evaluate caloric adherence, protein density relative to bodyweight (${weightKg} kg), and provide immediate Indian dietary optimizations in strict JSON format.`;

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
            temperature: 0.2,
          },
        });

        const result = await model.generateContent([{ text: promptText }]);
        response = result.response;
        if (response) {
          console.log(`[Gemini API] Successfully generated analysis with model: ${modelName}`);
          break;
        }
      } catch (err) {
        console.warn(`[Gemini API] Model ${modelName} failed with:`, err.status || err.message);
        lastError = err;
        // If 429 (quota exceeded), 404 (not found), or 503 (high demand), try next candidate
        if (
          err.status === 429 ||
          err.status === 404 ||
          err.status === 503 ||
          err.message?.includes("quota") ||
          err.message?.includes("429") ||
          err.message?.includes("503") ||
          err.message?.includes("Resource has been exhausted")
        ) {
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

    return res.status(200).json({
      summary: parsed.summary || `Analysis complete for the last ${days} days.`,
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      areas_for_improvement: Array.isArray(parsed.areas_for_improvement) ? parsed.areas_for_improvement : [],
      actionable_tips: Array.isArray(parsed.actionable_tips) ? parsed.actionable_tips : [],
    });
  } catch (error) {
    console.error("Gemini analyzeLogs error:", error);

    const isQuotaError =
      error.status === 429 ||
      error.message?.includes("quota") ||
      error.message?.includes("429") ||
      error.message?.includes("Resource has been exhausted");

    return res.status(500).json({
      error: isQuotaError
        ? "Gemini API rate limit reached. Please try again in a few seconds."
        : error.message?.includes("high demand") || error.status === 503
        ? "Gemini is currently experiencing high demand. Please retry in a moment."
        : error.message || "Failed to analyze nutrition logs",
    });
  }
}
