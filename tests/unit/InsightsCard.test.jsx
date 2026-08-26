import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import InsightsCard from '../../src/components/InsightsCard';

describe('InsightsCard Component', () => {
  const mockData = {
    summary: 'Great consistency over the last 14 days with strong protein adherence.',
    strengths: [
      'Hit daily protein target 12 out of 14 days',
      'Average calories were within 5% of maintenance goal',
    ],
    areas_for_improvement: [
      'Fiber was consistently below the recommended 35g',
      'Hydration dropped on weekends',
    ],
    actionable_tips: [
      'Add chia seeds or oats to breakfast for fiber',
      'Keep a water bottle near your desk on Saturday',
    ],
  };

  it('renders null when no data is passed', () => {
    const { container } = render(<InsightsCard data={null} days={7} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders header with dynamic timeframe days', () => {
    render(<InsightsCard data={mockData} days={14} />);
    expect(screen.getByText(/Your 14-Day Analysis/i)).toBeInTheDocument();
    expect(screen.getByText(/Nutritional Intelligence & Goal Progress/i)).toBeInTheDocument();
  });

  it('defaults to 7 days when days prop is omitted', () => {
    render(<InsightsCard data={mockData} />);
    expect(screen.getByText(/Your 7-Day Analysis/i)).toBeInTheDocument();
  });

  it('renders Section 1: The Verdict with summary text', () => {
    render(<InsightsCard data={mockData} days={14} />);
    expect(screen.getByText(/The Verdict/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Great consistency over the last 14 days/i)
    ).toBeInTheDocument();
  });

  it('renders Section 2: Wins with check icons and items', () => {
    render(<InsightsCard data={mockData} days={14} />);
    expect(screen.getByText(/^Wins$/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Hit daily protein target 12 out of 14 days/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Average calories were within 5% of maintenance goal/i)
    ).toBeInTheDocument();
  });

  it('renders Section 3: Keep an Eye On with alert icons and items', () => {
    render(<InsightsCard data={mockData} days={14} />);
    expect(screen.getByText(/Keep an Eye On/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Fiber was consistently below the recommended 35g/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Hydration dropped on weekends/i)
    ).toBeInTheDocument();
  });

  it('renders Section 4: Gameplan with target icons and tips', () => {
    render(<InsightsCard data={mockData} days={14} />);
    expect(screen.getByText(/Gameplan/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Add chia seeds or oats to breakfast for fiber/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Keep a water bottle near your desk on Saturday/i)
    ).toBeInTheDocument();
  });

  it('handles partial data with empty arrays gracefully', () => {
    const partialData = {
      summary: 'Short summary with no other sections.',
      strengths: [],
      areas_for_improvement: [],
      actionable_tips: [],
    };

    render(<InsightsCard data={partialData} days={7} />);
    expect(screen.getByText(/The Verdict/i)).toBeInTheDocument();
    expect(screen.queryByText(/^Wins$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Keep an Eye On/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Gameplan/i)).not.toBeInTheDocument();
  });
});
