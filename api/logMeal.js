import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";

const SYSTEM_INSTRUCTION = `You are a backend nutritional analysis engine. Your sole function is to estimate total calories and macronutrients (protein, carbs, fat, fiber) from either text descriptions or images of food. 
RULES:
1. STRICT JSON ONLY: Respond exclusively with a raw JSON object. No markdown formatting, no \`\`\`json blocks.
2. ESTIMATION HEURISTICS: Estimate based on standard adult portion sizes for plated meals. **CRITICAL: If the image is of a nutrition label or food packaging, extract the exact calories and macronutrient values stated on the label for one standard serving.**
3. OUTPUT SCHEMA: Return exactly this structure: { "food_summary": string, "calories": integer, "protein_g": integer, "carbs_g": integer, "fat_g": integer, "fiber_g": integer, "is_valid": boolean, "error_message": string or null }`;

// Helper to get GEMINI_API_KEY from process.env or .env.local
function getApiKey() {
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "your_gemini_api_key_here") {
    return process.env.GEMINI_API_KEY;
  }
  try {
    const envPath = path.resolve(process.cwd(), ".env.local");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      const match = content.match(/^GEMINI_API_KEY=(.+)$/m);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
  } catch (e) {
    console.warn("Could not read .env.local fallback:", e.message);
  }
  return process.env.GEMINI_API_KEY;
}

// Resilient JSON extractor
function extractAndParseJSON(raw) {
  if (!raw || typeof raw !== "string") {
    throw new Error("Empty AI response");
  }

  let text = raw.trim();

  // Strip markdown fences
  if (text.startsWith("```json")) {
    text = text.replace(/^```json\s*/, "").replace(/```$/, "").trim();
  } else if (text.startsWith("```")) {
    text = text.replace(/^```\s*/, "").replace(/```$/, "").trim();
  }

  // Direct parse attempt
  try {
    return JSON.parse(text);
  } catch (_) {
    // Extract outermost {...}
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (innerErr) {
        // Clean common unquoted or trailing issues
        let sanitized = match[0]
          .replace(/:\s*~?(\d+)\s*(kcal|calories|g|grams)?/gi, ": $1")
          .replace(/,\s*([\}\]])/g, "$1");
        return JSON.parse(sanitized);
      }
    }
    throw new Error(`Invalid JSON format: ${text.slice(0, 100)}`);
  }
}

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

    const model = genAI.getGenerativeModel({
      model: "gemini-3.6-flash",
      systemInstruction: SYSTEM_INSTRUCTION,
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1,
      },
    });

    // Build the prompt parts
    const parts = [];

    if (image) {
      // Multimodal: image + optional text context
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: image,
        },
      });
      parts.push({ text: text || "Analyze this food image and estimate total calories and macronutrients (protein, carbs, fat, fiber)." });
    } else {
      // Text-only
      parts.push({ text });
    }

    // Call model with 1 retry for transient spikes
    let response;
    try {
      const result = await model.generateContent(parts);
      response = result.response;
    } catch (apiErr) {
      if (apiErr.status === 503 || apiErr.message?.includes("503") || apiErr.message?.includes("high demand")) {
        console.warn("Retrying Gemini request after transient 503...");
        await new Promise((r) => setTimeout(r, 1000));
        const retryResult = await model.generateContent(parts);
        response = retryResult.response;
      } else {
        throw apiErr;
      }
    }

    const rawText = response.text();
    const parsed = extractAndParseJSON(rawText);

    // Ensure fallback fields exist
    return res.status(200).json({
      food_summary: parsed.food_summary || text || "Food",
      calories: Number(parsed.calories) || 0,
      protein_g: Number(parsed.protein_g) || 0,
      carbs_g: Number(parsed.carbs_g) || 0,
      fat_g: Number(parsed.fat_g) || 0,
      fiber_g: Number(parsed.fiber_g) || 0,
      is_valid: parsed.is_valid !== false,
      error_message: parsed.error_message || null,
    });
  } catch (error) {
    console.error("Gemini API error:", error);

    return res.status(500).json({
      food_summary: null,
      calories: 0,
      protein_g: 0,
      carbs_g: 0,
      fat_g: 0,
      fiber_g: 0,
      is_valid: false,
      error_message: error.message?.includes("high demand")
        ? "Gemini is currently experiencing high demand. Please retry in a moment."
        : error.message || "Failed to analyze meal",
    });
  }
}
