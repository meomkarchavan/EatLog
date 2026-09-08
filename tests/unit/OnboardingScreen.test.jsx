import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OnboardingScreen from '../../src/components/OnboardingScreen';
import * as firestore from 'firebase/firestore';

vi.mock('firebase/firestore', () => ({
  doc: vi.fn((db, coll, id) => ({ path: `${coll}/${id}`, id })),
  setDoc: vi.fn(() => Promise.resolve()),
}));

vi.mock('../../src/firebase', () => ({
  auth: { currentUser: { uid: 'test-user-onboarding-123' } },
  db: {},
}));

describe('OnboardingScreen Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all biometrics fields, body stats questions, and target selectors matching reference image', () => {
    render(<OnboardingScreen onComplete={vi.fn()} onSkip={vi.fn()} />);

    expect(screen.getByText('Profile & Goals')).toBeInTheDocument();
    expect(screen.getByText('BIOMETRICS & BODY STATS')).toBeInTheDocument();
    expect(screen.getByText('ACTIVITY & NUTRITION TARGETS')).toBeInTheDocument();

    expect(screen.getByLabelText(/Height \(cm\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Age \(years\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Current Weight \(kg\)/i)).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /^male/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /^female/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Activity Level/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Primary Goal/i)).toBeInTheDocument();

    expect(screen.getByRole('button', { name: /save profile & update targets/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /skip/i })).toBeInTheDocument();
  });

  it('calculates and displays live reactive macro targets based on initial defaults', () => {
    render(<OnboardingScreen onComplete={vi.fn()} onSkip={vi.fn()} />);

    // Default: 175cm, 27yo, 70kg, Male, Moderate, Maintain -> BMR ~ 1664, TDEE ~ 2579 kcal, Protein ~ 154g (2.2 * 70)
    expect(screen.getByText(/Live Macro Blueprint/i)).toBeInTheDocument();
    expect(screen.getByText('154')).toBeInTheDocument();
    expect(screen.getByText('2579')).toBeInTheDocument();
  });

  it('updates live blueprint when user changes weight and goal', async () => {
    const user = userEvent.setup();
    render(<OnboardingScreen onComplete={vi.fn()} onSkip={vi.fn()} />);

    const weightInput = screen.getByLabelText(/Current Weight \(kg\)/i);
    await user.clear(weightInput);
    await user.type(weightInput, '80');

    // 80kg * 2.2 = 176g protein
    expect(screen.getByText('176')).toBeInTheDocument();

    // Change goal to gain (+300 kcal)
    const goalSelect = screen.getByLabelText(/Primary Goal/i);
    await user.selectOptions(goalSelect, 'gain');

    // Live blueprint updates with TDEE + GAIN
    expect(screen.getByText(/TDEE:.*GAIN/i)).toBeInTheDocument();
  });

  it('saves profile and initial weight to Firestore and calls onComplete on submit', async () => {
    const onComplete = vi.fn();
    const user = userEvent.setup();
    render(<OnboardingScreen onComplete={onComplete} onSkip={vi.fn()} />);

    const submitBtn = screen.getByRole('button', { name: /save profile & update targets/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(firestore.setDoc).toHaveBeenCalledWith(
        expect.objectContaining({ path: 'user_profiles/test-user-onboarding-123' }),
        expect.objectContaining({
          height_cm: 175,
          age: 27,
          gender: 'M',
          activity_level: 'moderate',
          goal: 'maintain',
          current_weight_kg: 70,
          baseline_weight_kg: 70,
          onboarding_completed: true,
        }),
        { merge: true }
      );

      expect(onComplete).toHaveBeenCalled();
    });
  });

  it('triggers onSkip when skip button is clicked', async () => {
    const onSkip = vi.fn();
    const user = userEvent.setup();
    render(<OnboardingScreen onComplete={vi.fn()} onSkip={onSkip} />);

    const skipBtn = screen.getByRole('button', { name: /skip/i });
    await user.click(skipBtn);

    expect(onSkip).toHaveBeenCalled();
  });
});
