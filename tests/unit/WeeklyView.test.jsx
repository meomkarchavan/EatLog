import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import WeeklyView from '../../src/components/WeeklyView';

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  doc: vi.fn(),
  onSnapshot: vi.fn((q, callback) => {
    // Initial mock snapshot with some 7-day logs
    const today = new Date();
    const isoString = today.toISOString();
    callback({
      exists: () => true,
      data: () => ({
        goal: 'lose',
        height_cm: 180,
        age: 28,
        current_weight_kg: 80,
        activity_level: 'moderate',
      }),
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
    global.fetch = vi.fn();
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

  it('renders AI Nutrition Coach card with default 7-day timeframe selector and analyze button', () => {
    render(<WeeklyView />);

    expect(screen.getByText(/AI Nutrition Coach/i)).toBeInTheDocument();
    const timeframeSelect = screen.getByLabelText(/Timeframe selector/i);
    expect(timeframeSelect).toHaveValue('7');
    expect(
      screen.getByRole('button', { name: /Analyze My Data \(7 Days\)/i })
    ).toBeInTheDocument();
  });

  it('changes timeframe to 14 or 30 days and updates button label', () => {
    render(<WeeklyView />);

    const timeframeSelect = screen.getByLabelText(/Timeframe selector/i);
    fireEvent.change(timeframeSelect, { target: { value: '14' } });

    expect(timeframeSelect).toHaveValue('14');
    expect(
      screen.getByRole('button', { name: /Analyze My Data \(14 Days\)/i })
    ).toBeInTheDocument();

    fireEvent.change(timeframeSelect, { target: { value: '30' } });
    expect(timeframeSelect).toHaveValue('30');
    expect(
      screen.getByRole('button', { name: /Analyze My Data \(30 Days\)/i })
    ).toBeInTheDocument();
  });

  it('calls /api/analyzeLogs, displays InsightsCard, and transitions button to Refresh state', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        summary: 'Excellent progress towards your fat loss goal over the last 7 days.',
        strengths: ['Great protein consistency'],
        areas_for_improvement: ['Slightly lower hydration on weekends'],
        actionable_tips: ['Add an afternoon water reminder'],
      }),
    });

    render(<WeeklyView />);

    const analyzeBtn = screen.getByRole('button', { name: /Analyze My Data/i });
    fireEvent.click(analyzeBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/analyzeLogs', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }));
    });

    await waitFor(() => {
      expect(screen.getByTestId('insights-card')).toBeInTheDocument();
      expect(screen.getByText(/Your 7-Day Analysis/i)).toBeInTheDocument();
      expect(screen.getByText(/Excellent progress towards your fat loss goal/i)).toBeInTheDocument();
      // Button transitions to refresh button
      expect(screen.getByRole('button', { name: /Refresh Analysis \(7 Days\)/i })).toBeInTheDocument();
    });
  });

  it('renders an error alert when /api/analyzeLogs returns an error response', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({
        error: 'Gemini API rate limit reached. Please try again in a few seconds.',
      }),
    });

    render(<WeeklyView />);

    const analyzeBtn = screen.getByRole('button', { name: /Analyze My Data/i });
    fireEvent.click(analyzeBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/Gemini API rate limit reached/i)
      ).toBeInTheDocument();
    });
  });

  it('clears existing insights when the timeframe is changed', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        summary: 'Analysis for 7 days',
        strengths: ['Consistent meal timing'],
        areas_for_improvement: [],
        actionable_tips: [],
      }),
    });

    render(<WeeklyView />);

    const analyzeBtn = screen.getByRole('button', { name: /Analyze My Data/i });
    fireEvent.click(analyzeBtn);

    await waitFor(() => {
      expect(screen.getByTestId('insights-card')).toBeInTheDocument();
    });

    const timeframeSelect = screen.getByLabelText(/Timeframe selector/i);
    fireEvent.change(timeframeSelect, { target: { value: '30' } });

    expect(screen.queryByTestId('insights-card')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Analyze My Data \(30 Days\)/i })).toBeInTheDocument();
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
