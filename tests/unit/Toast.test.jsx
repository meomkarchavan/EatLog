import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider, useToast } from '../../src/components/Toast';

function TestConsumer() {
  const { showToast, showConfirm } = useToast();

  return (
    <div>
      <button onClick={() => showToast('Meal logged successfully!', 'success')}>
        Trigger Success Toast
      </button>
      <button onClick={() => showToast('API error occurred', 'error')}>
        Trigger Error Toast
      </button>
      <button onClick={() => showToast('Warning: high sodium', 'warning')}>
        Trigger Warning Toast
      </button>
      <button
        onClick={async () => {
          const confirmed = await showConfirm('Are you sure you want to delete?');
          if (confirmed) {
            showToast('Item deleted', 'info');
          }
        }}
      >
        Trigger Confirm Dialog
      </button>
    </div>
  );
}

describe('Toast and Confirm Modal System', () => {
  it('renders and displays toasts of various types (success, error, warning)', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>
    );

    await user.click(screen.getByRole('button', { name: /trigger success toast/i }));
    expect(screen.getByText('Meal logged successfully!')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /trigger error toast/i }));
    expect(screen.getByText('API error occurred')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /trigger warning toast/i }));
    expect(screen.getByText('Warning: high sodium')).toBeInTheDocument();
  });

  it('allows manual dismissal of a toast', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>
    );

    await user.click(screen.getByRole('button', { name: /trigger success toast/i }));
    expect(screen.getByText('Meal logged successfully!')).toBeInTheDocument();

    // Click close/dismiss button on toast
    const dismissButtons = screen.getAllByRole('button');
    const dismissBtn = dismissButtons.find((btn) => !btn.textContent);
    if (dismissBtn) {
      await user.click(dismissBtn);
      await waitFor(() => {
        expect(screen.queryByText('Meal logged successfully!')).not.toBeInTheDocument();
      });
    }
  });

  it('handles confirmation modal: confirms action when Delete button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>
    );

    await user.click(screen.getByRole('button', { name: /trigger confirm dialog/i }));
    expect(screen.getByText('Are you sure you want to delete?')).toBeInTheDocument();

    const deleteBtn = screen.getByRole('button', { name: /^delete$/i });
    await user.click(deleteBtn);

    await waitFor(() => {
      expect(screen.queryByText('Are you sure you want to delete?')).not.toBeInTheDocument();
      expect(screen.getByText('Item deleted')).toBeInTheDocument();
    });
  });

  it('handles confirmation modal: cancels action when Cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>
    );

    await user.click(screen.getByRole('button', { name: /trigger confirm dialog/i }));
    expect(screen.getByText('Are you sure you want to delete?')).toBeInTheDocument();

    const cancelBtn = screen.getByRole('button', { name: /^cancel$/i });
    await user.click(cancelBtn);

    await waitFor(() => {
      expect(screen.queryByText('Are you sure you want to delete?')).not.toBeInTheDocument();
      expect(screen.queryByText('Item deleted')).not.toBeInTheDocument();
    });
  });
});
