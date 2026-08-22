import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportAllDataAsCsv } from '../../src/utils/exportCsv';
import * as firestore from 'firebase/firestore';

vi.mock('firebase/firestore', () => ({
  collection: vi.fn((db, coll) => ({ path: coll })),
  query: vi.fn((...args) => args),
  where: vi.fn((field, op, val) => ({ field, op, val })),
  orderBy: vi.fn((field, dir) => ({ field, dir })),
  getDocs: vi.fn(),
}));

vi.mock('../../src/firebase', () => ({
  auth: { currentUser: { uid: 'test-user-123' } },
  db: {},
}));

describe('exportCsv Utility', () => {
  let createdLinks = [];
  let clickedLinks = [];

  beforeEach(() => {
    vi.clearAllMocks();
    createdLinks = [];
    clickedLinks = [];

    // Mock URL.createObjectURL and URL.revokeObjectURL
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:http://localhost/test-blob');
    globalThis.URL.revokeObjectURL = vi.fn();

    // Mock document.createElement('a')
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      const el = originalCreateElement(tagName);
      if (tagName === 'a') {
        createdLinks.push(el);
        el.click = () => clickedLinks.push(el);
      }
      return el;
    });
  });

  it('queries daily_logs and weight_logs for authenticated user and triggers CSV download', async () => {
    const mockMeals = [
      {
        id: 'meal-1',
        data: () => ({
          timestamp: '2026-08-22T08:30:00.000Z',
          food_summary: '2 eggs, 1 toast',
          calories: 320,
          protein_g: 18,
          carbs_g: 22,
          fat_g: 14,
          fiber_g: 2,
          input_method: 'text',
        }),
      },
      {
        id: 'meal-2',
        data: () => ({
          timestamp: '2026-08-22T13:00:00.000Z',
          food_summary: 'Chicken salad with "special" dressing, oil',
          calories: 550,
          protein_g: 45,
          carbs_g: 12,
          fat_g: 25,
          fiber_g: 5,
          input_method: 'vision',
        }),
      },
    ];

    const mockWeights = [
      {
        id: 'w-1',
        data: () => ({
          date: '2026-08-21',
          weight_kg: 75.5,
        }),
      },
      {
        id: 'w-2',
        data: () => ({
          date: '2026-08-22',
          weight_kg: 75.2,
        }),
      },
    ];

    firestore.getDocs.mockImplementation((q) => {
      // Check which collection is being queried
      const collPath = q[0]?.path;
      if (collPath === 'daily_logs') {
        return Promise.resolve({ docs: mockMeals });
      }
      if (collPath === 'weight_logs') {
        return Promise.resolve({ docs: mockWeights });
      }
      return Promise.resolve({ docs: [] });
    });

    const result = await exportAllDataAsCsv();

    expect(result.mealCount).toBe(2);
    expect(result.weightCount).toBe(2);
    expect(result.filename).toMatch(/^EatLog_Export_\d{4}-\d{2}-\d{2}\.csv$/);

    // Verify download link trigger
    expect(globalThis.URL.createObjectURL).toHaveBeenCalled();
    expect(clickedLinks.length).toBe(1);
    expect(clickedLinks[0].download).toBe(result.filename);
    expect(globalThis.URL.revokeObjectURL).toHaveBeenCalledWith('blob:http://localhost/test-blob');
  });

  it('throws error when user is not authenticated', async () => {
    const { auth } = await import('../../src/firebase');
    const originalUser = auth.currentUser;
    auth.currentUser = null;

    await expect(exportAllDataAsCsv()).rejects.toThrow('Not authenticated');

    auth.currentUser = originalUser;
  });
});
