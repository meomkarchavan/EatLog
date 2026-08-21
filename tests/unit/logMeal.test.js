import { describe, it, expect, vi, beforeEach } from 'vitest';
import handler from '../../api/logMeal';

vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: class {
    getGenerativeModel() {
      return {
        generateContent: vi.fn().mockResolvedValue({
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
        }),
      };
    }
  },
}));

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
});
