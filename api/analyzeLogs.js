import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";

const SYSTEM_INSTRUCTION = `You are an expert AI sports nutritionist and dietary coach specializing in Indian diets and athletic nutrition.
Your role is to analyze a user's logged nutrition data over a specified timeframe in comparison with their physical profile, daily targets, and fitness goals (such as muscle gain, fat loss, or maintenance).

CULTURAL & DIETARY CONTEXT (STRICT CONSTRAINTS):
1. ABSOLUTE RESTRICTIONS: NEVER suggest or mention beef or pork under any circumstance.
2. INDIAN CUISINE FOCUS: All actionable tips, snack suggestions, and meal recommendations must be culturally relevant to Indian diets. Never suggest Western-centric items (e.g., avoid turkey breast, beef jerky, deli slices, or canned tuna).
3. HIGH-PROTEIN INDIAN SOURCES: To close macro gaps and optimize for muscle gain and recovery, recommend accessible Indian high-protein sources:
   - Vegetarian & Dairy: Paneer, Greek yogurt / curd (dahi / hung curd), soya chunks, moong dal sprouts, roasted chana, sattu, or whey protein.
   - Non-Vegetarian (if applicable): Eggs (boiled / egg bhurji / omelettes) or chicken breast.

GENERAL RULES:
1. STRICT JSON ONLY: Respond exclusively with a raw JSON object. No markdown formatting, no \`\`\`json blocks.
2. ADHERENCE & MACRO ANALYSIS: Assess calorie intake vs target, protein sufficiency, consistency, and macronutrient balance.
3. TONE & COACHING STYLE: Use an empathetic, conversational, encouraging, and punchy tone like a dedicated personal coach. Avoid robotic, overly academic, or clinical phrasing (e.g., avoid clinical language like 'demonstrating that you have the capacity'). Speak directly to the user as 'you'.
4. OUTPUT SCHEMA: Return exactly this structure:
{
  "summary": "Concise 2-3 sentence overview evaluating overall performance and adherence over the timeframe.",
  "strengths": ["string", "string"],
  "areas_for_improvement": ["string", "string"],
  "actionable_tips": ["string", "string", "string"]
}`;

// Candidate models in order of preference with fallback capabilities
const CANDIDATE_MODELS = [
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-flash-latest",
  "gemini-2.5-flash",
  "gemini-2.0-flash-lite",
  "gemini-3.7-flash",
  "gemini-3.6-flash",
];

// Helper to get GEMINI_API_KEY from process.env, .env.local, .env.development, or .env.production
function getApiKey() {
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "your_gemini_api_key_here") {
    return process.env.GEMINI_API_KEY;
  }
  const envFiles = [".env.local", ".env.development", ".env.production", ".env"];
  for (const file of envFiles) {
    try {
      const envPath = path.resolve(process.cwd(), file);
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, "utf-8");
        const match = content.match(/^GEMINI_API_KEY=(.+)$/m);
        if (match && match[1] && match[1].trim() !== "your_gemini_api_key_here") {
          return match[1].trim();
        }
      }
    } catch (e) {
      // Continue searching
    }
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
        let sanitized = match[0]
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

    const promptText = `Analyze the user's nutritional data over the last ${days} days.

User Profile & Target Goals:
- Goal: ${profile?.goal || 'maintain'}
- Target Calories: ${profile?.targetCalories || profile?.calories || 'Not specified'} kcal/day
- Target Protein: ${profile?.targetMacros?.protein_g || profile?.protein_g || 'Not specified'} g/day
- Target Carbs: ${profile?.targetMacros?.carbs_g || profile?.carbs_g || 'Not specified'} g/day
- Target Fat: ${profile?.targetMacros?.fat_g || profile?.fat_g || 'Not specified'} g/day
- BMR / TDEE: ${profile?.bmr || 'N/A'} kcal / ${profile?.tdee || 'N/A'} kcal
- Current Weight: ${profile?.current_weight_kg || profile?.weight_kg || 'N/A'} kg

Logged Daily Totals (${logs.length} day records in ${days}-day window):
${JSON.stringify(logs, null, 2)}

Provide a strict JSON response with:
1. "summary": 2-3 sentence overview evaluating the ${days}-day trend against goals.
2. "strengths": Array of 2-4 specific positive achievements or consistent habits.
3. "areas_for_improvement": Array of 2-3 opportunities for better consistency or macro balance.
4. "actionable_tips": Array of 2-4 tangible, immediate next steps.`;

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
