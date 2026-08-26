import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  saveLookupToHistory,
  getLookupHistory,
  subscribeLookupHistory,
  deleteLookupFromHistory,
} from '../../src/services/lookupHistory';
import * as firestore from 'firebase/firestore';

vi.mock('firebase/firestore', () => ({
  collection: vi.fn((db, name) => ({ path: name })),
  doc: vi.fn((db, name, id) => ({ path: `${name}/${id}`, id })),
  addDoc: vi.fn(),
  getDocs: vi.fn(),
  deleteDoc: vi.fn(),
  onSnapshot: vi.fn((q, cb) => {
    cb({
      docs: [
        {
          id: 'doc-snap-1',
          data: () => ({
            userId: 'user-456',
            food_summary: 'Protein Bar',
            calories: 210,
            protein_g: 20,
            carbs_g: 22,
            fat_g: 7,
            fiber_g: 10,
            createdAt: new Date('2026-01-01T12:00:00Z'),
          }),
        },
      ],
    });
    return vi.fn();
  }),
  query: vi.fn((coll, ...clauses) => ({ coll, clauses })),
  where: vi.fn((field, op, val) => ({ field, op, val })),
  orderBy: vi.fn((field, dir) => ({ field, dir })),
  limit: vi.fn((num) => ({ limit: num })),
  serverTimestamp: vi.fn(() => 'MOCK_SERVER_TIMESTAMP'),
}));

vi.mock('../../src/firebase', () => ({
  db: { type: 'mockDb' },
}));

describe('Lookup History Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('saveLookupToHistory', () => {
    it('returns null if userId or data is missing', async () => {
      expect(await saveLookupToHistory(null, { food_summary: 'Apple' })).toBeNull();
      expect(await saveLookupToHistory('user-123', null)).toBeNull();
    });

    it('saves valid food lookup to lookup_history collection in Firestore', async () => {
      firestore.addDoc.mockResolvedValueOnce({ id: 'doc-abc-123' });

      const itemData = {
        food_summary: 'Grilled Chicken Salad',
        calories: 350,
        protein_g: 35,
        carbs_g: 10,
        fat_g: 12,
        fiber_g: 4,
      };

      const result = await saveLookupToHistory('user-456', itemData);

      expect(firestore.collection).toHaveBeenCalledWith(expect.anything(), 'lookup_history');
      expect(firestore.addDoc).toHaveBeenCalledWith(
        expect.objectContaining({ path: 'lookup_history' }),
        expect.objectContaining({
          userId: 'user-456',
          food_summary: 'Grilled Chicken Salad',
          calories: 350,
          protein_g: 35,
          carbs_g: 10,
          fat_g: 12,
          fiber_g: 4,
          createdAt: 'MOCK_SERVER_TIMESTAMP',
        })
      );

      expect(result).toMatchObject({
        id: 'doc-abc-123',
        userId: 'user-456',
        food_summary: 'Grilled Chicken Salad',
        calories: 350,
        protein_g: 35,
      });
    });
  });

  describe('getLookupHistory', () => {
    it('returns empty array if userId is not provided', async () => {
      const results = await getLookupHistory(null);
      expect(results).toEqual([]);
    });

    it('queries lookup_history for userId ordered by createdAt desc with limit 20', async () => {
      const mockDocs = [
        {
          id: 'doc-1',
          data: () => ({
            userId: 'user-789',
            food_summary: 'Oatmeal with Almonds',
            calories: 220,
            protein_g: 8,
            carbs_g: 35,
            fat_g: 6,
            fiber_g: 5,
          }),
        },
      ];

      firestore.getDocs.mockResolvedValueOnce({ docs: mockDocs });

      const results = await getLookupHistory('user-789');

      expect(firestore.collection).toHaveBeenCalledWith(expect.anything(), 'lookup_history');
      expect(firestore.where).toHaveBeenCalledWith('userId', '==', 'user-789');
      expect(firestore.orderBy).toHaveBeenCalledWith('createdAt', 'desc');
      expect(firestore.limit).toHaveBeenCalledWith(20);
      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        id: 'doc-1',
        userId: 'user-789',
        food_summary: 'Oatmeal with Almonds',
        calories: 220,
        protein_g: 8,
        carbs_g: 35,
        fat_g: 6,
        fiber_g: 5,
      });
    });
  });

  describe('subscribeLookupHistory', () => {
    it('returns empty array if userId is not provided', () => {
      const onUpdate = vi.fn();
      const unsub = subscribeLookupHistory(null, onUpdate);
      expect(onUpdate).toHaveBeenCalledWith([]);
      expect(typeof unsub).toBe('function');
    });

    it('subscribes with onSnapshot and returns mapped and sorted items', () => {
      const onUpdate = vi.fn();
      const unsub = subscribeLookupHistory('user-456', onUpdate);

      expect(firestore.onSnapshot).toHaveBeenCalled();
      expect(onUpdate).toHaveBeenCalledWith([
        expect.objectContaining({
          id: 'doc-snap-1',
          food_summary: 'Protein Bar',
          calories: 210,
        }),
      ]);
      expect(typeof unsub).toBe('function');
    });
  });

  describe('deleteLookupFromHistory', () => {
    it('returns false if historyId is falsy', async () => {
      const result = await deleteLookupFromHistory(null);
      expect(result).toBe(false);
      expect(firestore.deleteDoc).not.toHaveBeenCalled();
    });

    it('deletes document from lookup_history in Firestore', async () => {
      firestore.deleteDoc.mockResolvedValueOnce();

      const result = await deleteLookupFromHistory('hist-123');
      expect(result).toBe(true);
      expect(firestore.doc).toHaveBeenCalledWith(expect.anything(), 'lookup_history', 'hist-123');
      expect(firestore.deleteDoc).toHaveBeenCalledWith(expect.objectContaining({ path: 'lookup_history/hist-123' }));
    });
  });
});
