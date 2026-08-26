import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfileScreen from '../../src/components/ProfileScreen';
import * as firestore from 'firebase/firestore';

let profileCallback = null;

vi.mock('firebase/firestore', () => ({
  doc: vi.fn((db, coll, id) => ({ path: `${coll}/${id}`, id })),
  onSnapshot: vi.fn((ref, callback) => {
    profileCallback = callback;
    callback({
      exists: () => false,
      data: () => ({}),
    });
    return vi.fn();
  }),
  setDoc: vi.fn(() => Promise.resolve()),
}));

vi.mock('../../src/firebase', () => ({
  auth: { currentUser: { uid: 'test-user-123' } },
  db: {},
}));

describe('ProfileScreen Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    profileCallback = null;
  });

  it('renders form inputs for height, age, baseline weight, activity, and goals', () => {
    render(<ProfileScreen latestWeightKg={null} />);

    expect(screen.getByText('Profile & Goals')).toBeInTheDocument();
    expect(screen.getByLabelText(/height/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/age/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/current \/ baseline weight/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save profile/i })).toBeInTheDocument();
  });

  it('calculates targets and updates preview cards when profile exists', async () => {
    render(<ProfileScreen latestWeightKg={80} />);

    // Simulate profile loaded from Firestore
    profileCallback({
      exists: () => true,
      data: () => ({
        height_cm: 180,
        age: 30,
        gender: 'M',
        activity_level: 'moderate',
        goal: 'lose',
        baseline_weight_kg: 80,
      }),
    });

    await waitFor(() => {
      // Calorie target 2459, Protein 176g
      expect(screen.getByText('2459')).toBeInTheDocument();
      expect(screen.getByText('176')).toBeInTheDocument();
      expect(screen.getByText(/24.7/i)).toBeInTheDocument(); // BMI
    });
  });

  it('calls setDoc on user_profiles/{uid} when form is submitted', async () => {
    const user = userEvent.setup();
    render(<ProfileScreen latestWeightKg={75.25} />);

    await user.type(screen.getByLabelText(/height/i), '175');
    await user.type(screen.getByLabelText(/age/i), '25');
    await user.type(screen.getByLabelText(/current \/ baseline weight/i), '75.25');

    const saveBtn = screen.getByRole('button', { name: /save profile/i });
    await user.click(saveBtn);

    await waitFor(() => {
      expect(firestore.doc).toHaveBeenCalledWith(
        expect.anything(),
        'user_profiles',
        'test-user-123'
      );
      expect(firestore.setDoc).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'test-user-123' }),
        expect.objectContaining({
          user_id: 'test-user-123',
          height_cm: 175,
          age: 25,
          baseline_weight_kg: 75.25,
        }),
        { merge: true }
      );
    });
  });
});
