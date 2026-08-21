import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WaterTracker from '../../src/components/WaterTracker';
import * as firestore from 'firebase/firestore';

let snapshotCallback = null;

vi.mock('firebase/firestore', () => ({
  doc: vi.fn((db, coll, id) => ({ path: `${coll}/${id}`, id })),
  onSnapshot: vi.fn((ref, callback) => {
    snapshotCallback = callback;
    // Initial call with empty doc
    callback({
      exists: () => false,
      data: () => ({}),
    });
    return vi.fn(); // unsubscribe
  }),
  setDoc: vi.fn(() => Promise.resolve()),
  increment: vi.fn((val) => ({ _type: 'increment', value: val })),
  getFirestore: vi.fn(),
}));

vi.mock('../../src/firebase', () => ({
  auth: { currentUser: { uid: 'test-user-123' } },
  db: {},
}));

describe('WaterTracker Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    snapshotCallback = null;
  });

  it('renders initial state with 0 ml, minus button disabled, and +250ml button', () => {
    render(<WaterTracker selectedDate="2026-08-21" />);

    expect(screen.getByText(/Water Intake/i)).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText(/ml \(0.00 L\)/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /\+250ml/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /−/i })).toBeDisabled();
  });

  it('updates total_ml when Firestore onSnapshot fires with data', async () => {
    render(<WaterTracker selectedDate="2026-08-21" />);

    snapshotCallback({
      exists: () => true,
      data: () => ({ total_ml: 1250 }),
    });

    await waitFor(() => {
      expect(screen.getByText(/1,250/i)).toBeInTheDocument();
      expect(screen.getByText(/ml \(1.25 L\)/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /−/i })).not.toBeDisabled();
    });
  });

  it('calls setDoc with increment(250) on deterministic doc ID when +250ml is clicked', async () => {
    const user = userEvent.setup();
    render(<WaterTracker selectedDate="2026-08-21" />);

    const button = screen.getByRole('button', { name: /\+250ml/i });
    await user.click(button);

    await waitFor(() => {
      expect(firestore.doc).toHaveBeenCalledWith(
        expect.anything(),
        'water_logs',
        'test-user-123_2026-08-21'
      );
      expect(firestore.setDoc).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'test-user-123_2026-08-21' }),
        {
          total_ml: { _type: 'increment', value: 250 },
          user_id: 'test-user-123',
          date: '2026-08-21',
        },
        { merge: true }
      );
    });
  });

  it('calls setDoc with increment(-250) when minus button is clicked', async () => {
    const user = userEvent.setup();
    render(<WaterTracker selectedDate="2026-08-21" />);

    snapshotCallback({
      exists: () => true,
      data: () => ({ total_ml: 500 }),
    });

    const minusBtn = await screen.findByRole('button', { name: /−/i });
    await user.click(minusBtn);

    await waitFor(() => {
      expect(firestore.setDoc).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'test-user-123_2026-08-21' }),
        {
          total_ml: { _type: 'increment', value: -250 },
          user_id: 'test-user-123',
          date: '2026-08-21',
        },
        { merge: true }
      );
    });
  });
});
