import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DatePicker from '../../src/components/DatePicker';

describe('DatePicker Component', () => {
  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <DatePicker
        isOpen={false}
        selectedDate="2026-08-22"
        onSelectDate={vi.fn()}
        onClose={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders month name, weekday headers, and calendar grid when open', () => {
    render(
      <DatePicker
        isOpen={true}
        selectedDate="2026-08-15"
        onSelectDate={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText(/August 2026/i)).toBeInTheDocument();
    expect(screen.getByText('Mon')).toBeInTheDocument();
    expect(screen.getByText('Fri')).toBeInTheDocument();
    expect(screen.getByText('Sun')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '15' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /go to today/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('calls onSelectDate and onClose when an enabled day button is clicked', async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn();
    const handleClose = vi.fn();

    render(
      <DatePicker
        isOpen={true}
        selectedDate="2026-08-15"
        onSelectDate={handleSelect}
        onClose={handleClose}
      />
    );

    const day10Btn = screen.getByRole('button', { name: '10' });
    await user.click(day10Btn);

    expect(handleSelect).toHaveBeenCalledWith('2026-08-10');
    expect(handleClose).toHaveBeenCalled();
  });

  it('navigates to previous month on chevron left click', async () => {
    const user = userEvent.setup();

    render(
      <DatePicker
        isOpen={true}
        selectedDate="2026-08-15"
        onSelectDate={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText(/August 2026/i)).toBeInTheDocument();

    const buttons = screen.getAllByRole('button');
    // First button in the header is ChevronLeft
    await user.click(buttons[0]);

    expect(screen.getByText(/July 2026/i)).toBeInTheDocument();
  });

  it('navigates to today and closes modal when "Go to Today" is clicked', async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn();
    const handleClose = vi.fn();

    render(
      <DatePicker
        isOpen={true}
        selectedDate="2026-05-10"
        onSelectDate={handleSelect}
        onClose={handleClose}
      />
    );

    const todayBtn = screen.getByRole('button', { name: /go to today/i });
    await user.click(todayBtn);

    expect(handleSelect).toHaveBeenCalled();
    expect(handleClose).toHaveBeenCalled();
  });
});
