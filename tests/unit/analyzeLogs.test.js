import { describe, it, expect, vi, beforeEach } from 'vitest';
import handler from '../../api/analyzeLogs';

let mockGenerateContent = vi.fn();

vi.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: class {
      getGenerativeModel({ model }) {
        return {
          generateContent: (...args) => mockGenerateContent(model, ...args),
        };
      }
    },
  };
});

function createMockReqRes({ method = 'POST', body = {} } = {}) {
  const req = { method, body };
  const res = {
    statusCode: 200,
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.data = payload;
      return this;
    },
  };
  return { req, res };
}

describe('api/analyzeLogs Serverless Function', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GEMINI_API_KEY = 'mock-gemini-key';
  });

  it('rejects non-POST HTTP methods with 405', async () => {
    const { req, res } = createMockReqRes({ method: 'GET' });
    await handler(req, res);

    expect(res.statusCode).toBe(405);
    expect(res.data).toEqual({ error: 'Method not allowed' });
  });

  it('rejects requests with missing logs array or timeframe_days with 400', async () => {
    const { req, res } = createMockReqRes({
      method: 'POST',
      body: { profile: {} },
    });
    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.data).toEqual({
      error: "Request must include 'logs' array and 'timeframe_days'",
    });
  });

  it('processes valid nutrition logs and returns structured coaching JSON schema', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () =>
          JSON.stringify({
            summary:
              'Over the past 7 days, your protein intake met your target of 150g on 5 out of 7 days.',
            strengths: [
              'Consistent protein intake during weekdays',
              'Hydration maintained above 2.5L daily',
            ],
            areas_for_improvement: [
              'Weekend calorie intake exceeded target by ~400 kcal',
            ],
            actionable_tips: [
              'Pre-plan weekend meals to prevent surplus',
              'Add a high-protein afternoon snack on Saturdays',
            ],
          }),
      },
    });

    const { req, res } = createMockReqRes({
      method: 'POST',
      body: {
        timeframe_days: 7,
        profile: {
          goal: 'lose',
          targetCalories: 2100,
          targetMacros: { protein_g: 160, carbs_g: 200, fat_g: 60, fiber_g: 35 },
          bmr: 1750,
          tdee: 2400,
          current_weight_kg: 78,
        },
        logs: [
          { date: '2026-08-20', calories: 2050, protein_g: 155, carbs_g: 190, fat_g: 58, fiber_g: 32 },
          { date: '2026-08-21', calories: 2100, protein_g: 162, carbs_g: 195, fat_g: 60, fiber_g: 34 },
        ],
      },
    });

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.data).toEqual({
      summary:
        'Over the past 7 days, your protein intake met your target of 150g on 5 out of 7 days.',
      strengths: [
        'Consistent protein intake during weekdays',
        'Hydration maintained above 2.5L daily',
      ],
      areas_for_improvement: [
        'Weekend calorie intake exceeded target by ~400 kcal',
      ],
      actionable_tips: [
        'Pre-plan weekend meals to prevent surplus',
        'Add a high-protein afternoon snack on Saturdays',
      ],
    });
  });

  it('correctly strips markdown code fences from AI response', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () =>
          "```json\n" +
          JSON.stringify({
            summary: 'Markdown formatted response test.',
            strengths: ['Strength 1'],
            areas_for_improvement: ['Area 1'],
            actionable_tips: ['Tip 1'],
          }) +
          "\n```",
      },
    });

    const { req, res } = createMockReqRes({
      method: 'POST',
      body: {
        timeframe_days: 7,
        profile: {},
        logs: [{ date: '2026-08-20', calories: 2000, protein_g: 140 }],
      },
    });

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.data.summary).toBe('Markdown formatted response test.');
    expect(res.data.strengths).toEqual(['Strength 1']);
  });

  it('automatically falls back to next candidate model on 429 quota or 503 high demand error', async () => {
    const quotaErr = new Error('503 Service Unavailable: High demand');
    quotaErr.status = 503;
    mockGenerateContent.mockRejectedValueOnce(quotaErr);

    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () =>
          JSON.stringify({
            summary: '14-day analysis completed via fallback model.',
            strengths: ['Great macro consistency'],
            areas_for_improvement: ['Slight fiber deficit'],
            actionable_tips: ['Incorporate more legumes'],
          }),
      },
    });

    const { req, res } = createMockReqRes({
      method: 'POST',
      body: {
        timeframe_days: 14,
        profile: { goal: 'maintain' },
        logs: [{ date: '2026-08-20', calories: 2200, protein_g: 140, carbs_g: 220, fat_g: 65, fiber_g: 25 }],
      },
    });

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.data.summary).toBe('14-day analysis completed via fallback model.');
    expect(res.data.strengths).toEqual(['Great macro consistency']);
  });

  it('returns 500 when all candidate models fail', async () => {
    mockGenerateContent.mockRejectedValue(new Error('Internal server error'));

    const { req, res } = createMockReqRes({
      method: 'POST',
      body: {
        timeframe_days: 7,
        profile: {},
        logs: [{ date: '2026-08-20', calories: 2000, protein_g: 140 }],
      },
    });

    await handler(req, res);

    expect(res.statusCode).toBe(500);
    expect(res.data.error).toBeDefined();
  });
});
