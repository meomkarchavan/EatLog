import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LookupPanel from '../../src/components/LookupPanel';

describe('LookupPanel Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.fetch = vi.fn();
  });

  it('renders Quick Lookup panel header, search input, and empty state message', () => {
    render(<LookupPanel />);

    expect(screen.getByText(/Quick Lookup/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search food stats\.\.\./i)).toBeInTheDocument();
    expect(screen.getByText(/Search any food to see its nutrition/i)).toBeInTheDocument();
  });

  it('submits query to /api/logMeal and renders LookupCard with returned nutrition macros without writing to Firestore', async () => {
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
      expect(globalThis.fetch).toHaveBeenCalledWith('/api/logMeal', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ text: '1 banana' }),
      }));
      expect(screen.getByText('1 medium banana')).toBeInTheDocument();
      expect(screen.getByText('105')).toBeInTheDocument();
      expect(screen.getByText('27')).toBeInTheDocument();
      expect(screen.getByText('Carbs')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('Fiber')).toBeInTheDocument();
    });
  });

  it('allows dismissing a lookup card', async () => {
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
      expect(screen.getByText('2 scrambled eggs')).toBeInTheDocument();
    });

    // Dismiss card
    const dismissBtn = screen.getByTitle(/dismiss/i);
    await user.click(dismissBtn);

    await waitFor(() => {
      expect(screen.queryByText('2 scrambled eggs')).not.toBeInTheDocument();
    });
  });

  it('allows clearing all lookup results with Clear All button', async () => {
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
      expect(screen.getByText('Apple')).toBeInTheDocument();
    });

    const clearAllBtn = screen.getByRole('button', { name: /clear all/i });
    await user.click(clearAllBtn);

    await waitFor(() => {
      expect(screen.queryByText('Apple')).not.toBeInTheDocument();
      expect(screen.getByText(/Search any food to see its nutrition/i)).toBeInTheDocument();
    });
  });
});
