import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LandingPage from '../../src/components/LandingPage';

describe('LandingPage Component', () => {
  it('renders bold typography hero headline, subheadline, and primary CTAs', () => {
    render(<LandingPage onGetStarted={vi.fn()} onSignIn={vi.fn()} />);

    expect(screen.getByText(/Track Every Gram/i)).toBeInTheDocument();
    expect(screen.getByText(/Fuel Every Rep/i)).toBeInTheDocument();
    expect(screen.getByText(/Build Real Strength/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /start tracking free/i })).toBeInTheDocument();
  });

  it('renders live interactive HUD mockup with selectable meal presets', async () => {
    const user = userEvent.setup();
    render(<LandingPage onGetStarted={vi.fn()} onSignIn={vi.fn()} />);

    // Default preset is post-workout (685 kcal, 62g protein) -> Total 2835 kcal, 182g protein
    expect(screen.getByTestId('hero-mock-calories')).toHaveTextContent('2835');
    expect(screen.getByTestId('hero-mock-protein')).toHaveTextContent('182');

    // Switch to Ribeye & Jasmine Rice preset
    const ribeyeBtn = screen.getByRole('button', { name: /ribeye & jasmine rice/i });
    await user.click(ribeyeBtn);

    // 2150 + 890 = 3040 kcal, 120 + 68 = 188g protein
    expect(screen.getByTestId('hero-mock-calories')).toHaveTextContent('3040');
    expect(screen.getByTestId('hero-mock-protein')).toHaveTextContent('188');
  });

  it('renders asymmetric bento feature grid sections', () => {
    render(<LandingPage onGetStarted={vi.fn()} onSignIn={vi.fn()} />);

    expect(screen.getByText(/Natural Language Omni-Input/i)).toBeInTheDocument();
    expect(screen.getByText(/Dynamic Targets/i)).toBeInTheDocument();
    expect(screen.getByText(/1-Tap Hydration/i)).toBeInTheDocument();
    expect(screen.getByText(/Pinned Staples/i)).toBeInTheDocument();
    expect(screen.getByText(/Weekly Trends/i)).toBeInTheDocument();
  });

  it('renders AI Nutrition Coach insights mockup and testimonials', () => {
    render(<LandingPage onGetStarted={vi.fn()} onSignIn={vi.fn()} />);

    expect(screen.getByText(/An AI Coach That Understands/i)).toBeInTheDocument();
    expect(screen.getByText(/Your 7-Day Performance Verdict/i)).toBeInTheDocument();
    expect(screen.getByText(/Built for Athletes Who Demand Results/i)).toBeInTheDocument();
    expect(screen.getByText('Marcus S.')).toBeInTheDocument();
  });

  it('calculates dynamic targets in the interactive macro estimator', async () => {
    const user = userEvent.setup();
    render(<LandingPage onGetStarted={vi.fn()} onSignIn={vi.fn()} />);

    expect(screen.getByText(/Calculate Your Custom Macro Blueprint/i)).toBeInTheDocument();

    // Default 78kg * 2.2 = 172g protein
    expect(screen.getByText('172')).toBeInTheDocument();

    // Click Bulk / Cut goal buttons
    const cutBtn = screen.getByRole('button', { name: /cut \(-350\)/i });
    await user.click(cutBtn);

    const applyBtn = screen.getByRole('button', { name: /apply this blueprint in eatlog/i });
    expect(applyBtn).toBeInTheDocument();
  });

  it('triggers onGetStarted when primary CTA buttons are clicked', async () => {
    const handleGetStarted = vi.fn();
    const user = userEvent.setup();
    render(<LandingPage onGetStarted={handleGetStarted} onSignIn={vi.fn()} />);

    const heroCta = screen.getByRole('button', { name: /start tracking free/i });
    await user.click(heroCta);

    expect(handleGetStarted).toHaveBeenCalled();
  });
});
