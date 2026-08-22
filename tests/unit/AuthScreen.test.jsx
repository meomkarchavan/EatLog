import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuthScreen from '../../src/components/AuthScreen';
import * as firebaseAuth from 'firebase/auth';

vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signInWithPopup: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  getAuth: vi.fn(() => ({})),
}));

vi.mock('../../src/firebase', () => ({
  auth: {},
  googleProvider: {},
}));

describe('AuthScreen Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders sign in form with Google auth button, email, and password inputs by default', () => {
    render(<AuthScreen />);

    expect(screen.getByText('EatLog')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('toggles password visibility when eye icon button is clicked', async () => {
    const user = userEvent.setup();
    render(<AuthScreen />);

    const passwordInput = screen.getByPlaceholderText('Password');
    const toggleBtn = screen.getByTitle(/show password/i);

    expect(passwordInput).toHaveAttribute('type', 'password');

    // Click to show password
    await user.click(toggleBtn);
    expect(passwordInput).toHaveAttribute('type', 'text');
    expect(screen.getByTitle(/hide password/i)).toBeInTheDocument();

    // Click again to hide password
    await user.click(screen.getByTitle(/hide password/i));
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('toggles to sign up mode and updates button and text', async () => {
    const user = userEvent.setup();
    render(<AuthScreen />);

    const toggleBtn = screen.getByRole('button', { name: /don't have an account\? sign up/i });
    await user.click(toggleBtn);

    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /already have an account\? sign in/i })).toBeInTheDocument();
  });

  it('validates password min length and required attributes', () => {
    render(<AuthScreen />);

    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Password');

    expect(emailInput).toBeRequired();
    expect(emailInput).toHaveAttribute('type', 'email');
    expect(passwordInput).toBeRequired();
    expect(passwordInput).toHaveAttribute('minLength', '6');
  });

  it('calls signInWithEmailAndPassword on form submit in sign-in mode', async () => {
    firebaseAuth.signInWithEmailAndPassword.mockResolvedValueOnce({ user: { uid: 'user-123' } });
    const user = userEvent.setup();
    render(<AuthScreen />);

    await user.type(screen.getByPlaceholderText('Email'), 'test@example.com');
    await user.type(screen.getByPlaceholderText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(firebaseAuth.signInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'test@example.com',
        'password123'
      );
    });
  });

  it('calls createUserWithEmailAndPassword on form submit in sign-up mode', async () => {
    firebaseAuth.createUserWithEmailAndPassword.mockResolvedValueOnce({ user: { uid: 'user-456' } });
    const user = userEvent.setup();
    render(<AuthScreen />);

    await user.click(screen.getByRole('button', { name: /sign up/i }));
    await user.type(screen.getByPlaceholderText('Email'), 'newuser@example.com');
    await user.type(screen.getByPlaceholderText('Password'), 'password456');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(firebaseAuth.createUserWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'newuser@example.com',
        'password456'
      );
    });
  });

  it('calls signInWithPopup when Continue with Google button is clicked', async () => {
    firebaseAuth.signInWithPopup.mockResolvedValueOnce({ user: { uid: 'google-user-789' } });
    const user = userEvent.setup();
    render(<AuthScreen />);

    const googleBtn = screen.getByRole('button', { name: /continue with google/i });
    await user.click(googleBtn);

    await waitFor(() => {
      expect(firebaseAuth.signInWithPopup).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything()
      );
    });
  });

  it('displays user-friendly error message on auth failure', async () => {
    firebaseAuth.signInWithEmailAndPassword.mockRejectedValueOnce({
      code: 'auth/invalid-credential',
      message: 'Invalid credentials',
    });
    const user = userEvent.setup();
    render(<AuthScreen />);

    await user.type(screen.getByPlaceholderText('Email'), 'wrong@example.com');
    await user.type(screen.getByPlaceholderText('Password'), 'wrongpass');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password.')).toBeInTheDocument();
    });
  });
});

