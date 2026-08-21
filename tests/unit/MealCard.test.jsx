import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MealCard from '../../src/components/MealCard';
import * as firestore from 'firebase/firestore';

vi.mock('firebase/firestore', () => ({
  doc: vi.fn((db, coll, id) => ({ path: `${coll}/${id}`, id })),
  updateDoc: vi.fn(() => Promise.resolve()),
  deleteDoc: vi.fn(() => Promise.resolve()),
}));

vi.mock('../../src/firebase', () => ({
  db: {},
}));

describe('MealCard Component', () => {
  const mockLog = {
    docId: 'meal-123',
    food_summary: '3 chapatis with 1 katori moong dal',
    calories: 410,
    protein_g: 16,
    carbs_g: 68,
    fat_g: 7,
    fiber_g: 10,
    timestamp: '2026-08-21T12:00:00.000Z',
    input_method: 'text',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    window.confirm = vi.fn(() => true);
  });

  it('renders meal details and secondary macro badges', () => {
    render(<MealCard log={mockLog} />);

    expect(screen.getByText('3 chapatis with 1 katori moong dal')).toBeInTheDocument();
    expect(screen.getByText('410')).toBeInTheDocument();
    expect(screen.getByText('16')).toBeInTheDocument();
    expect(screen.getByText('68g carbs')).toBeInTheDocument();
    expect(screen.getByText('7g fat')).toBeInTheDocument();
    expect(screen.getByText('10g fiber')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
  });

  it('opens inline edit mode when Edit button is clicked', async () => {
    const user = userEvent.setup();
    render(<MealCard log={mockLog} />);

    await user.click(screen.getByRole('button', { name: /edit/i }));

    expect(screen.getByText('Edit Meal Log')).toBeInTheDocument();
    expect(screen.getByDisplayValue('3 chapatis with 1 katori moong dal')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete log/i })).toBeInTheDocument();
  });

  it('saves updated meal description and numbers using updateDoc', async () => {
    const user = userEvent.setup();
    render(<MealCard log={mockLog} />);

    await user.click(screen.getByRole('button', { name: /edit/i }));

    const descInput = screen.getByDisplayValue('3 chapatis with 1 katori moong dal');
    await user.clear(descInput);
    await user.type(descInput, '2 chapatis with 1 katori moong dal');

    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(firestore.doc).toHaveBeenCalledWith(
        expect.anything(),
        'daily_logs',
        'meal-123'
      );
      expect(firestore.updateDoc).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'meal-123' }),
        expect.objectContaining({
          food_summary: '2 chapatis with 1 katori moong dal',
          calories: 410,
          protein_g: 16,
        })
      );
    });
  });

  it('allows recalculating with AI button in edit mode', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        food_summary: '2 chapatis with 1 katori moong dal',
        calories: 310,
        protein_g: 12,
        carbs_g: 50,
        fat_g: 5,
        fiber_g: 7,
        is_valid: true,
        error_message: null,
      }),
    });

    const user = userEvent.setup();
    render(<MealCard log={mockLog} />);

    await user.click(screen.getByRole('button', { name: /edit/i }));

    const descInput = screen.getByDisplayValue('3 chapatis with 1 katori moong dal');
    await user.clear(descInput);
    await user.type(descInput, '2 chapatis with 1 katori moong dal');

    const aiRecalcBtn = screen.getByRole('button', { name: /ai recalc/i });
    await user.click(aiRecalcBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/logMeal', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ text: '2 chapatis with 1 katori moong dal' }),
      }));
      expect(screen.getByDisplayValue('310')).toBeInTheDocument();
      expect(screen.getByDisplayValue('12')).toBeInTheDocument();
    });
  });

  it('deletes log when Delete button is clicked and confirmed', async () => {
    const user = userEvent.setup();
    render(<MealCard log={mockLog} />);

    await user.click(screen.getByRole('button', { name: /edit/i }));
    await user.click(screen.getByRole('button', { name: /delete log/i }));

    await waitFor(() => {
      expect(firestore.deleteDoc).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'meal-123' })
      );
    });
  });
});
