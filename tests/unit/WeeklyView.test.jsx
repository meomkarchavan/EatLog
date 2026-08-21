import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import WeeklyView from '../../src/components/WeeklyView';

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  onSnapshot: vi.fn((q, callback) => {
    // Initial mock snapshot with some 7-day logs
    const today = new Date();
    const isoString = today.toISOString();
    callback({
      docs: [
        {
          id: 'log-1',
          data: () => ({
            calories: 500,
            protein_g: 40,
            timestamp: isoString,
          }),
        },
        {
          id: 'log-2',
          data: () => ({
            calories: 900,
            protein_g: 100, // Total 140g for today (>120g threshold), 1400 kcal
            timestamp: isoString,
          }),
        },
      ],
    });
    return vi.fn();
  }),
}));

vi.mock('../../src/firebase', () => ({
  auth: { currentUser: { uid: 'test-user-123' } },
  db: {},
}));

describe('WeeklyView Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders 7-Day summary metrics (Protein Avg, Calories Avg, Water Avg)', () => {
    render(<WeeklyView />);

    expect(screen.getByText(/Protein Avg/i)).toBeInTheDocument();
    expect(screen.getByText(/Calories Avg/i)).toBeInTheDocument();
    expect(screen.getByText(/Water Avg/i)).toBeInTheDocument();

    // 140g total across 7 days = 140 / 7 = 20 g/day
    expect(screen.getByText('20')).toBeInTheDocument();
    // 1400 kcal total across 7 days = 1400 / 7 = 200 kcal/day
    expect(screen.getByText('200')).toBeInTheDocument();
  });

  it('renders Recharts chart sections for daily protein, calories, water intake, and body weight', () => {
    render(<WeeklyView />);

    expect(screen.getByText(/Daily Protein \(Last 7 Days\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Daily Calories \(Last 7 Days\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Daily Water Intake \(Last 7 Days\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Body Weight \(Last 7 Days\)/i)).toBeInTheDocument();
  });

  it('renders 90-day consistency heatmap section with threshold legend', () => {
    render(<WeeklyView />);

    expect(screen.getByText(/90-Day Protein Consistency/i)).toBeInTheDocument();
    expect(screen.getByText(/Dark green indicates >120g target achieved/i)).toBeInTheDocument();
    expect(screen.getAllByText('0g').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('1–120g')).toBeInTheDocument();
    expect(screen.getAllByText('>120g').length).toBeGreaterThanOrEqual(1);
  });
});
