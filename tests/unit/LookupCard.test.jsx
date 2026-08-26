import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LookupCard from '../../src/components/LookupCard';

describe('LookupCard Component', () => {
  const mockData = {
    id: 'test-1',
    food_summary: 'Avocado Toast with Poached Egg',
    calories: 290,
    protein_g: 12,
    carbs_g: 22,
    fat_g: 18,
    fiber_g: 6,
  };

  it('renders nothing when data is null', () => {
    const { container } = render(<LookupCard data={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders food summary and macro facts accurately', () => {
    render(<LookupCard data={mockData} />);

    expect(screen.getByText('Avocado Toast with Poached Egg')).toBeInTheDocument();
    expect(screen.getByText('290')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('22')).toBeInTheDocument();
    expect(screen.getByText('18')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
  });

  it('calls onAddToDailyLog callback when Quick-Add button is clicked', async () => {
    const user = userEvent.setup();
    const mockAdd = vi.fn();

    render(<LookupCard data={mockData} onAddToDailyLog={mockAdd} />);

    const addBtn = screen.getByTitle(/add to daily log/i);
    await user.click(addBtn);

    expect(mockAdd).toHaveBeenCalledTimes(1);
    expect(mockAdd).toHaveBeenCalledWith(mockData);
  });

  it('calls onDismiss when dismiss button is clicked', async () => {
    const user = userEvent.setup();
    const mockDismiss = vi.fn();

    render(<LookupCard data={mockData} onDismiss={mockDismiss} />);

    const dismissBtn = screen.getByTitle('Dismiss');
    await user.click(dismissBtn);

    expect(mockDismiss).toHaveBeenCalledTimes(1);
  });

  it('shows loading spinner and disables button when isAdding is true', () => {
    const mockAdd = vi.fn();
    render(<LookupCard data={mockData} onAddToDailyLog={mockAdd} isAdding={true} />);

    const addBtn = screen.getByTitle(/adding to log\.\.\./i);
    expect(addBtn).toBeDisabled();
    expect(screen.getByText('Adding...')).toBeInTheDocument();
  });
});
