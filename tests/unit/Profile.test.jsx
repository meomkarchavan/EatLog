import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Profile from '../../src/components/Profile';
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

describe('Profile Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    profileCallback = null;
  });

  it('renders form inputs for height, age, current weight, activity, and goals', () => {
    render(<Profile latestWeightKg={null} />);

    expect(screen.getByText('Profile & Goals')).toBeInTheDocument();
    expect(screen.getByLabelText(/height/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/age/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/current weight/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save profile/i })).toBeInTheDocument();
  });

  it('calculates targets and updates preview cards when profile exists', async () => {
    render(<Profile latestWeightKg={80} />);

    profileCallback({
      exists: () => true,
      data: () => ({
        height_cm: 180,
        age: 30,
        gender: 'M',
        activity_level: 'moderate',
        goal: 'lose',
        current_weight_kg: 80,
      }),
    });

    await waitFor(() => {
      expect(screen.getByText('2459')).toBeInTheDocument();
      expect(screen.getByText('176')).toBeInTheDocument();
      expect(screen.getByText('24.7')).toBeInTheDocument();
    });
  });

  it('calls setDoc on user_profiles/{uid} when form is submitted', async () => {
    const user = userEvent.setup();
    render(<Profile latestWeightKg={75} />);

    await user.type(screen.getByLabelText(/height/i), '175');
    await user.type(screen.getByLabelText(/age/i), '25');
    await user.clear(screen.getByLabelText(/current weight/i));
    await user.type(screen.getByLabelText(/current weight/i), '75');

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
          current_weight_kg: 75,
        }),
        { merge: true }
      );
    });
  });

  it('renders Export CSV section and triggers export when button is clicked', async () => {
    const user = userEvent.setup();
    const exportCsvModule = await import('../../src/utils/exportCsv');
    const exportSpy = vi.spyOn(exportCsvModule, 'exportAllDataAsCsv').mockResolvedValueOnce({
      filename: 'EatLog_Export_2026-08-22.csv',
      mealCount: 15,
      weightCount: 7,
    });

    render(<Profile latestWeightKg={75} />);

    expect(screen.getByText('Export Your Data')).toBeInTheDocument();
    const exportBtn = screen.getByRole('button', { name: /export all data \(csv\)/i });

    await user.click(exportBtn);

    await waitFor(() => {
      expect(exportSpy).toHaveBeenCalled();
      expect(screen.getByText(/Exported 15 meals \+ 7 weight entries/i)).toBeInTheDocument();
    });
  });
});

