import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LookupPanel from '../../src/components/LookupPanel';
import * as lookupHistoryService from '../../src/services/lookupHistory';

const mockShowToast = vi.fn();

vi.mock('../../src/components/Toast', () => ({
  useToast: () => ({
    showToast: mockShowToast,
  }),
}));

vi.mock('../../src/firebase', () => ({
  auth: {
    currentUser: { uid: 'test-user-123' },
  },
  db: {},
}));

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn((auth, cb) => {
    cb({ uid: 'test-user-123' });
    return vi.fn();
  }),
}));

export const mockAddDoc = vi.fn();
export const mockCollection = vi.fn();

vi.mock('firebase/firestore', () => ({
  addDoc: (...args) => mockAddDoc(...args),
  collection: (...args) => mockCollection(...args),
}));

vi.mock('../../src/services/lookupHistory', () => ({
  saveLookupToHistory: vi.fn(),
  getLookupHistory: vi.fn(),
  getLocalLookupHistory: vi.fn(() => [
    {
      id: 'hist-1',
      food_summary: 'Greek Yogurt Bowl',
      calories: 180,
      protein_g: 20,
      carbs_g: 15,
      fat_g: 2,
      fiber_g: 1,
    },
  ]),
  saveLocalLookupHistory: vi.fn(),
  subscribeLookupHistory: vi.fn((uid, cb) => {
    cb([
      {
        id: 'hist-1',
        food_summary: 'Greek Yogurt Bowl',
        calories: 180,
        protein_g: 20,
        carbs_g: 15,
        fat_g: 2,
        fiber_g: 1,
      },
    ]);
    return vi.fn();
  }),
  deleteLookupFromHistory: vi.fn(),
}));

describe('LookupPanel Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.fetch = vi.fn();
    lookupHistoryService.getLocalLookupHistory.mockReturnValue([
      {
        id: 'hist-1',
        food_summary: 'Greek Yogurt Bowl',
        calories: 180,
        protein_g: 20,
        carbs_g: 15,
        fat_g: 2,
        fiber_g: 1,
      },
    ]);
    lookupHistoryService.getLookupHistory.mockResolvedValue([
      {
        id: 'hist-1',
        food_summary: 'Greek Yogurt Bowl',
        calories: 180,
        protein_g: 20,
        carbs_g: 15,
        fat_g: 2,
        fiber_g: 1,
      },
    ]);
    lookupHistoryService.subscribeLookupHistory.mockImplementation((uid, cb) => {
      cb([
        {
          id: 'hist-1',
          food_summary: 'Greek Yogurt Bowl',
          calories: 180,
          protein_g: 20,
          carbs_g: 15,
          fat_g: 2,
          fiber_g: 1,
        },
      ]);
      return vi.fn();
    });
    lookupHistoryService.saveLookupToHistory.mockImplementation(async (uid, data) => ({
      id: 'saved-doc-1',
      ...data,
    }));
    lookupHistoryService.deleteLookupFromHistory.mockResolvedValue(true);
  });

  it('renders Quick Lookup panel header, search input, and loads past lookup history with all macros on mount', async () => {
    render(<LookupPanel />);

    expect(screen.getByText(/Quick Lookup/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search food stats\.\.\./i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Greek Yogurt Bowl')).toBeInTheDocument();
      expect(screen.getByText('180 kcal')).toBeInTheDocument();
      expect(screen.getByText('20g P')).toBeInTheDocument();
      expect(screen.getByText('15g C')).toBeInTheDocument();
      expect(screen.getByText('2g F')).toBeInTheDocument();
      expect(screen.getByText('1g Fib')).toBeInTheDocument();
    });
  });

  it('submits query to /api/logMeal, saves to Firestore lookup history, and renders LookupCard', async () => {
    const user = userEvent.setup();

    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        is_valid: true,
        food_summary: '1 medium banana',
        calories: 105,
        protein_g: 1,
        carbs_g: 27,
        fat_g: 0,
        fiber_g: 3,
      }),
    });

    render(<LookupPanel />);

    const input = screen.getByPlaceholderText(/Search food stats\.\.\./i);
    await user.type(input, '1 banana{enter}');

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/logMeal',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ text: '1 banana' }),
        })
      );
      expect(lookupHistoryService.saveLookupToHistory).toHaveBeenCalledWith(
        'test-user-123',
        expect.objectContaining({
          food_summary: '1 medium banana',
          calories: 105,
          protein_g: 1,
        })
      );
      expect(screen.getByText(/Current Search/i)).toBeInTheDocument();
      expect(screen.getAllByText('1 medium banana').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('105')).toBeInTheDocument();
      expect(screen.getByText('27')).toBeInTheDocument();
      expect(screen.getByText('Carbs')).toBeInTheDocument();
    });
  });

  it('allows deleting an item from lookup history', async () => {
    const user = userEvent.setup();

    render(<LookupPanel />);

    await waitFor(() => {
      expect(screen.getByText('Greek Yogurt Bowl')).toBeInTheDocument();
    });

    const deleteBtn = screen.getByTitle(/delete from history/i);
    await user.click(deleteBtn);

    expect(lookupHistoryService.deleteLookupFromHistory).toHaveBeenCalledWith('hist-1', 'test-user-123');
    expect(screen.queryByText('Greek Yogurt Bowl')).not.toBeInTheDocument();
    expect(mockShowToast).toHaveBeenCalledWith('Removed from lookup history', 'info');
  });

  it('calls onAddMeal or writes to Firestore when Quick-Add button is clicked on lookup card and history item', async () => {
    const user = userEvent.setup();
    const mockOnAddMeal = vi.fn();

    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        is_valid: true,
        food_summary: '1 Protein Shake',
        calories: 200,
        protein_g: 30,
        carbs_g: 5,
        fat_g: 3,
        fiber_g: 2,
      }),
    });

    render(<LookupPanel onAddMeal={mockOnAddMeal} />);

    // Wait for history item to be rendered
    await waitFor(() => {
      expect(screen.getByText('Greek Yogurt Bowl')).toBeInTheDocument();
    });

    // Quick-add from history item
    const historyAddBtn = screen.getByTitle(/Quick-Add to Daily Log/i);
    await user.click(historyAddBtn);

    expect(mockOnAddMeal).toHaveBeenCalledWith(
      expect.objectContaining({ food_summary: 'Greek Yogurt Bowl', calories: 180, protein_g: 20 })
    );

    // Now submit search and quick-add from LookupCard
    const input = screen.getByPlaceholderText(/Search food stats\.\.\./i);
    await user.type(input, 'protein shake{enter}');

    await waitFor(() => {
      expect(screen.getByText(/Current Search/i)).toBeInTheDocument();
    });

    const cardAddBtn = screen.getByTitle(/^add to daily log$/i);
    await user.click(cardAddBtn);

    expect(mockOnAddMeal).toHaveBeenCalledWith(
      expect.objectContaining({ food_summary: '1 Protein Shake', calories: 200, protein_g: 30 })
    );
  });

  it('directly writes to Firestore daily_logs if onAddMeal prop is not provided', async () => {
    const user = userEvent.setup();
    mockAddDoc.mockResolvedValueOnce({ id: 'new-log-1' });

    render(<LookupPanel />);

    await waitFor(() => {
      expect(screen.getByText('Greek Yogurt Bowl')).toBeInTheDocument();
    });

    const historyAddBtn = screen.getByTitle(/Quick-Add to Daily Log/i);
    await user.click(historyAddBtn);

    expect(mockAddDoc).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({
        user_id: 'test-user-123',
        food_summary: 'Greek Yogurt Bowl',
        calories: 180,
        protein_g: 20,
        input_method: 'lookup',
      })
    );
    expect(mockShowToast).toHaveBeenCalledWith('Logged: Greek Yogurt Bowl', 'success');
  });

  it('allows dismissing a lookup card from current search results', async () => {
    const user = userEvent.setup();

    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        is_valid: true,
        food_summary: '2 scrambled eggs',
        calories: 180,
        protein_g: 12,
        carbs_g: 2,
        fat_g: 14,
        fiber_g: 0,
      }),
    });

    render(<LookupPanel />);

    const input = screen.getByPlaceholderText(/Search food stats\.\.\./i);
    await user.type(input, '2 eggs{enter}');

    await waitFor(() => {
      expect(screen.getByText(/Current Search/i)).toBeInTheDocument();
    });

    // Dismiss card
    const dismissBtn = screen.getByTitle(/dismiss/i);
    await user.click(dismissBtn);

    await waitFor(() => {
      expect(screen.queryByText(/Current Search/i)).not.toBeInTheDocument();
    });
  });

  it('allows clearing all lookup results with Clear All button without affecting persistent history', async () => {
    const user = userEvent.setup();

    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        is_valid: true,
        food_summary: 'Apple',
        calories: 95,
        protein_g: 0,
        carbs_g: 25,
        fat_g: 0,
        fiber_g: 4,
      }),
    });

    render(<LookupPanel />);

    const input = screen.getByPlaceholderText(/Search food stats\.\.\./i);
    await user.type(input, 'apple{enter}');

    await waitFor(() => {
      expect(screen.getByText(/Current Search/i)).toBeInTheDocument();
    });

    const clearAllBtn = screen.getByRole('button', { name: /clear all/i });
    await user.click(clearAllBtn);

    await waitFor(() => {
      expect(screen.queryByText(/Current Search/i)).not.toBeInTheDocument();
      // Persistent history section still exists
      expect(screen.getByText(/Recent Lookups/i)).toBeInTheDocument();
    });
  });
});
