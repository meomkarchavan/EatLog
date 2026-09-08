import fs from "fs";
import path from "path";

/**
 * Retrieves the Gemini API key from process.env or local env files.
 */
export function getApiKey() {
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "your_gemini_api_key_here") {
    return process.env.GEMINI_API_KEY;
  }

  // Load from local env files if running locally in Node
  if (typeof process.loadEnvFile === "function") {
    try { process.loadEnvFile(path.resolve(process.cwd(), ".env.local")); } catch (_) {
      try { process.loadEnvFile(path.resolve(process.cwd(), ".env")); } catch (_) {}
    }
  }

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
    } catch (_) {}
  }
  return process.env.GEMINI_API_KEY;
}

/**
 * Parses JSON from raw Gemini model text output, stripping markdown fences if present.
 */
export function extractAndParseJSON(raw) {
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

  try {
    return JSON.parse(text);
  } catch (_) {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      const sanitized = match[0]
        .replace(/:\s*~?(\d+)\s*(kcal|calories|g|grams)?/gi, ": $1")
        .replace(/,\s*([\}\]])/g, "$1");
      return JSON.parse(sanitized);
    }
    throw new Error(`Invalid JSON format: ${text.slice(0, 100)}`);
  }
}

/**
 * Ordered list of Gemini model candidates for fallback on 429/404/503.
 */
export const CANDIDATE_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.5-flash",
  "gemini-3.6-flash",
  "gemini-3-flash-preview",
];
