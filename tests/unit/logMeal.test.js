import { describe, it, expect, vi, beforeEach } from 'vitest';
import handler from '../../api/logMeal';

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

describe('api/logMeal Serverless Function', () => {
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

  it('rejects requests with missing text and image with 400', async () => {
    const { req, res } = createMockReqRes({ method: 'POST', body: {} });
    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.data).toEqual({ error: "Request must include 'text' or 'image'" });
  });

  it('processes valid text meal request and returns structured nutritional JSON with secondary macros', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () => JSON.stringify({
          food_summary: '2 boiled eggs',
          calories: 140,
          protein_g: 12,
          carbs_g: 1,
          fat_g: 10,
          fiber_g: 0,
          is_valid: true,
          error_message: null,
        }),
      },
    });

    const { req, res } = createMockReqRes({
      method: 'POST',
      body: { text: '2 boiled eggs' },
    });

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.data).toEqual({
      food_summary: '2 boiled eggs',
      calories: 140,
      protein_g: 12,
      carbs_g: 1,
      fat_g: 10,
      fiber_g: 0,
      is_valid: true,
      error_message: null,
    });
  });

  it('automatically falls back to next model when primary model encounters 429 quota error', async () => {
    // First model throws 429 Too Many Requests
    const quotaErr = new Error('429 Too Many Requests: Quota exceeded');
    quotaErr.status = 429;
    mockGenerateContent.mockRejectedValueOnce(quotaErr);

    // Second fallback model succeeds
    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () => JSON.stringify({
          food_summary: 'Protein Shake',
          calories: 200,
          protein_g: 30,
          carbs_g: 5,
          fat_g: 3,
          fiber_g: 1,
          is_valid: true,
          error_message: null,
        }),
      },
    });

    const { req, res } = createMockReqRes({
      method: 'POST',
      body: { text: 'Protein Shake' },
    });

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.data.calories).toBe(200);
    expect(res.data.protein_g).toBe(30);
  });
});
