import { GoogleGenerativeAI } from '@google/generative-ai';
import { getApiKey, CANDIDATE_MODELS } from '../api/_geminiUtils.js';

const envType = process.argv[2] || 'dev';
const targetUrls = {
  dev: 'https://eat-log-git-dev-omkar-chavans-projects.vercel.app',
  prod: 'https://eattlog.vercel.app',
  local: 'http://localhost:3000',
};

const baseUrl = targetUrls[envType] || envType;

console.log('\n======================================================');
console.log(`🧪 Live API & Gemini Model Smoke Test`);
console.log(`   Target Environment: ${envType}`);
console.log(`   Base URL:           ${baseUrl}`);
console.log('======================================================\n');

let hasFailure = false;

async function testDirectGeminiCandidates() {
  console.log('--- 1. Testing Configured Gemini Candidate Models ---');
  const apiKey = getApiKey();
  if (!apiKey) {
    console.error('❌ FAIL: GEMINI_API_KEY is missing in local environment.');
    hasFailure = true;
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  let activeCount = 0;

  await Promise.all(
    CANDIDATE_MODELS.map(async (modelName) => {
      const start = Date.now();
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const res = await model.generateContent('Ping');
        const text = res?.response?.text()?.trim() || '';
        const duration = Date.now() - start;
        activeCount++;
        console.log(`  ✅ Model [${modelName}]: Active & Responding (${duration}ms) -> "${text.slice(0, 20)}..."`);
      } catch (err) {
        const duration = Date.now() - start;
        const status = err.status || 'ERROR';
        const msg = err.message?.slice(0, 80) || 'Unknown error';
        console.warn(`  ⚠️ Model [${modelName}]: FAILED (${status}, ${duration}ms) -> ${msg}`);
      }
    })
  );

  if (activeCount === 0) {
    console.error('  ❌ CRITICAL: None of the candidate Gemini models responded.');
    hasFailure = true;
  } else {
    console.log(`  ℹ️ Healthy candidates: ${activeCount}/${CANDIDATE_MODELS.length} available for auto-fallback.`);
  }
  console.log('');
}

async function testLogMealEndpoint() {
  console.log('--- 2. Testing Live /api/logMeal Endpoint ---');
  const start = Date.now();
  const testMeal = '1 standard bowl moong dal khichdi with 1 tsp ghee';

  try {
    const res = await fetch(`${baseUrl}/api/logMeal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: testMeal }),
    });

    const duration = Date.now() - start;

    if (!res.ok) {
      const errText = await res.text();
      console.error(`  ❌ FAIL: /api/logMeal returned HTTP ${res.status} (${duration}ms)`);
      console.error(`     Response: ${errText.slice(0, 200)}`);
      hasFailure = true;
      return;
    }

    const data = await res.json();
    if (!data.is_valid || !data.calories || data.calories <= 0) {
      console.error(`  ❌ FAIL: /api/logMeal returned invalid nutrition payload:`, data);
      hasFailure = true;
      return;
    }

    console.log(`  ✅ PASS: /api/logMeal parsed successfully (${duration}ms)`);
    console.log(`     Summary:  ${data.food_summary}`);
    console.log(`     Macros:   ${data.calories} kcal | P: ${data.protein_g}g | C: ${data.carbs_g}g | F: ${data.fat_g}g | Fib: ${data.fiber_g}g`);
    if (data.cooking_fat_assumed) {
      console.log(`     Fat Note: ${data.cooking_fat_assumed}`);
    }
  } catch (err) {
    const duration = Date.now() - start;
    console.error(`  ❌ FAIL: Network request to /api/logMeal failed (${duration}ms):`, err.message);
    hasFailure = true;
  }
  console.log('');
}

async function testAnalyzeLogsEndpoint() {
  console.log('--- 3. Testing Live /api/analyzeLogs Endpoint ---');
  const start = Date.now();
  const payload = {
    timeframe_days: 7,
    profile: {
      targetCalories: 2100,
      targetMacros: { protein_g: 150, carbs_g: 200, fat_g: 55, fiber_g: 30 },
      bmr: 1750,
      tdee: 2400,
      current_weight_kg: 78,
    },
    logs: [
      { date: '2026-09-01', calories: 2050, protein_g: 148, carbs_g: 195, fat_g: 52, fiber_g: 28 },
      { date: '2026-09-02', calories: 2100, protein_g: 155, carbs_g: 200, fat_g: 56, fiber_g: 31 },
    ],
  };

  try {
    const res = await fetch(`${baseUrl}/api/analyzeLogs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const duration = Date.now() - start;

    if (!res.ok) {
      const errText = await res.text();
      console.error(`  ❌ FAIL: /api/analyzeLogs returned HTTP ${res.status} (${duration}ms)`);
      console.error(`     Response: ${errText.slice(0, 200)}`);
      hasFailure = true;
      return;
    }

    const data = await res.json();
    if (!data.summary || !Array.isArray(data.actionable_tips)) {
      console.error(`  ❌ FAIL: /api/analyzeLogs returned invalid coaching payload:`, data);
      hasFailure = true;
      return;
    }

    console.log(`  ✅ PASS: /api/analyzeLogs generated coaching insights (${duration}ms)`);
    console.log(`     Summary:  ${data.summary.slice(0, 100)}...`);
    console.log(`     Tips:     ${data.actionable_tips.length} actionable tips provided`);
  } catch (err) {
    const duration = Date.now() - start;
    console.error(`  ❌ FAIL: Network request to /api/analyzeLogs failed (${duration}ms):`, err.message);
    hasFailure = true;
  }
  console.log('');
}

async function run() {
  await testDirectGeminiCandidates();
  await testLogMealEndpoint();
  await testAnalyzeLogsEndpoint();

  console.log('======================================================');
  if (hasFailure) {
    console.error('❌ LIVE API SMOKE TEST FAILED');
    console.error('   Do not deploy to production until the live API passes.');
    console.log('======================================================\n');
    process.exit(1);
  } else {
    console.log('✅ ALL LIVE API CHECKS PASSED');
    console.log('   All candidate models and live serverless routes are healthy.');
    console.log('======================================================\n');
    process.exit(0);
  }
}

run();
