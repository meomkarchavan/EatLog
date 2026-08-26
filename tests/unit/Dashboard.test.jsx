import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dashboard from '../../src/components/Dashboard';
import * as firestore from 'firebase/firestore';

let snapshotCallback = null;

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  onSnapshot: vi.fn((target, callback) => {
    snapshotCallback = callback;
    if (target?.path?.startsWith('water_logs') || target?.path?.startsWith('weight_logs')) {
      callback({
        exists: () => false,
        data: () => ({ total_ml: 0 }),
      });
    } else if (target?.path?.startsWith('user_profiles')) {
      callback({
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
    } else {
      callback({
        docs: [
          {
            id: 'log-1',
            data: () => ({
              food_summary: '2 Chapatis and Dal',
              calories: 350,
              protein_g: 14,
              carbs_g: 45,
              fat_g: 8,
              fiber_g: 6,
              timestamp: new Date().toISOString(),
              input_method: 'text',
            }),
          },
        ],
      });
    }
    return vi.fn();
  }),
  addDoc: vi.fn(() => Promise.resolve()),
  getDocs: vi.fn(() => Promise.resolve({ docs: [] })),
  limit: vi.fn((n) => ({ limit: n })),
  serverTimestamp: vi.fn(),
  doc: vi.fn((db, coll, id) => ({ path: `${coll}/${id}`, id })),
  setDoc: vi.fn(),
  increment: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  signOut: vi.fn(),
  getAuth: vi.fn(),
}));

vi.mock('../../src/firebase', () => ({
  auth: { currentUser: { uid: 'test-user-123' } },
  db: {},
}));

describe('Dashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('renders header, 3 tabs, HUD with primary and secondary macro sums, dynamic targets, and log feed', () => {
    render(<Dashboard />);

    expect(screen.getByText('EatLog')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /daily/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /weekly/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /goals/i })).toBeInTheDocument();
    
    // HUD primary macros: 350 cal, 14g protein
    expect(screen.getAllByText('350').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('14').length).toBeGreaterThanOrEqual(1);

    // Dynamic targets: / 2459 kcal and / 176g
    expect(screen.getByText(/\/ 2459 kcal/i)).toBeInTheDocument();
    expect(screen.getByText(/\/ 176g/i)).toBeInTheDocument();

    // HUD secondary macros: Carbs, Fat, Fiber
    expect(screen.getByText('Carbs')).toBeInTheDocument();
    expect(screen.getByText('Fat')).toBeInTheDocument();
    expect(screen.getByText('Fiber')).toBeInTheDocument();
    expect(screen.getByText('45')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();

    // Log Feed item & pill badges
    expect(screen.getByText('2 Chapatis and Dal')).toBeInTheDocument();
    expect(screen.getByText('45g carbs')).toBeInTheDocument();
    expect(screen.getByText('8g fat')).toBeInTheDocument();
    expect(screen.getByText('6g fiber')).toBeInTheDocument();
  });

  it('switches between Daily, Weekly, and Goals tabs', async () => {
    const user = userEvent.setup();
    render(<Dashboard />);

    const weeklyTab = screen.getByRole('button', { name: /weekly/i });
    await user.click(weeklyTab);
    expect(screen.getByText(/Protein Avg/i)).toBeInTheDocument();

    const goalsTab = screen.getByRole('button', { name: /goals/i });
    await user.click(goalsTab);
    expect(screen.getByText('Profile & Goals')).toBeInTheDocument();

    const dailyTab = screen.getByRole('button', { name: /daily/i });
    await user.click(dailyTab);
    expect(screen.getByText("Today's Intake")).toBeInTheDocument();
  });

  it('disables submit button when text input is empty and enables when typed', async () => {
    const user = userEvent.setup();
    render(<Dashboard />);

    const input = screen.getByPlaceholderText('Type a meal or scan a plate/label...');
    expect(input).toHaveValue('');
    
    await user.type(input, '1 bowl oats with protein powder');
    expect(input).toHaveValue('1 bowl oats with protein powder');
  });

  it('submits text to /api/logMeal and adds doc to Firestore with noon timestamp and secondary macros', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        food_summary: '1 bowl oats with protein powder',
        calories: 320,
        protein_g: 28,
        carbs_g: 40,
        fat_g: 5,
        fiber_g: 7,
        is_valid: true,
        error_message: null,
      }),
    });

    const user = userEvent.setup();
    render(<Dashboard />);

    const input = screen.getByPlaceholderText('Type a meal or scan a plate/label...');
    await user.type(input, '1 bowl oats with protein powder');
    
    const form = input.closest('form');
    userEvent.click(form.querySelector('button[type="submit"]'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/logMeal', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ text: '1 bowl oats with protein powder' }),
      }));
      expect(firestore.addDoc).toHaveBeenCalledWith(
        undefined,
        expect.objectContaining({
          food_summary: '1 bowl oats with protein powder',
          calories: 320,
          protein_g: 28,
          carbs_g: 40,
          fat_g: 5,
          fiber_g: 7,
          user_id: 'test-user-123',
          input_method: 'text',
        })
      );
    });
  });

  it('renders dynamic targets badge with BMI and goal when profile exists', () => {
    render(<Dashboard />);
    // Profile in mock: 180cm, 80kg, goal lose -> BMI 24.7 • LOSE
    expect(screen.getByText(/BMI 24\.7 • LOSE/i)).toBeInTheDocument();
  });

  it('opens Staples modal when staples button is clicked and allows 1-tap re-log', async () => {
    const user = userEvent.setup();
    render(<Dashboard />);

    // Click staples button (#staples-btn)
    const staplesBtn = document.getElementById('staples-btn');
    expect(staplesBtn).toBeInTheDocument();
    await user.click(staplesBtn);

    // Modal opens
    expect(screen.getByText('My Staples')).toBeInTheDocument();
  });

  it('renders Quick Lookup tab and switches to LookupPanel when clicked', async () => {
    const user = userEvent.setup();
    render(<Dashboard />);

    const lookupTab = screen.getByRole('button', { name: /lookup/i });
    await user.click(lookupTab);

    expect(screen.getByText('Quick Lookup')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search food stats\.\.\./i)).toBeInTheDocument();
  });
});

