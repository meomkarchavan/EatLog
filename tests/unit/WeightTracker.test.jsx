import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WeightTracker from '../../src/components/WeightTracker';
import * as firestore from 'firebase/firestore';

let snapshotCallback = null;

vi.mock('firebase/firestore', () => ({
  doc: vi.fn((db, coll, id) => ({ path: `${coll}/${id}`, id })),
  onSnapshot: vi.fn((ref, callback) => {
    snapshotCallback = callback;
    // Initial call with non-existent doc
    callback({
      exists: () => false,
      data: () => ({}),
    });
    return vi.fn(); // unsubscribe
  }),
  setDoc: vi.fn(() => Promise.resolve()),
}));

vi.mock('../../src/firebase', () => ({
  auth: { currentUser: { uid: 'test-user-123' } },
  db: {},
}));

describe('WeightTracker Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    snapshotCallback = null;
  });

  it('renders initial state with input when no weight is recorded', () => {
    render(<WeightTracker selectedDate="2026-08-21" />);

    expect(screen.getByText(/Morning Weight/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e\.g\. 74\.5/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
  });

  it('displays recorded weight when Firestore snapshot has data', async () => {
    render(<WeightTracker selectedDate="2026-08-21" />);

    snapshotCallback({
      exists: () => true,
      data: () => ({ weight_kg: 76.5 }),
    });

    await waitFor(() => {
      expect(screen.getByText('76.5')).toBeInTheDocument();
      expect(screen.getByText('kg')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    });
  });

  it('calls setDoc with merge: true when weight is entered and saved', async () => {
    const user = userEvent.setup();
    render(<WeightTracker selectedDate="2026-08-21" />);

    const input = screen.getByPlaceholderText(/e\.g\. 74\.5/i);
    const saveBtn = screen.getByRole('button', { name: /save/i });

    await user.type(input, '75.2');
    await user.click(saveBtn);

    await waitFor(() => {
      expect(firestore.doc).toHaveBeenCalledWith(
        expect.anything(),
        'weight_logs',
        'test-user-123_2026-08-21'
      );
      expect(firestore.setDoc).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'test-user-123_2026-08-21' }),
        expect.objectContaining({
          user_id: 'test-user-123',
          date: '2026-08-21',
          weight_kg: 75.2,
        }),
        { merge: true }
      );
    });
  });
});
