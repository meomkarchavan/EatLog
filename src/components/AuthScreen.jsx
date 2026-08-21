import { useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { auth } from '../firebase';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      const messages = {
        'auth/invalid-credential': 'Invalid email or password.',
        'auth/email-already-in-use': 'Account already exists.',
        'auth/weak-password': 'Password must be at least 6 characters.',
        'auth/invalid-email': 'Invalid email address.',
      };
      setError(messages[err.code] || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full bg-black px-6">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <h1 className="text-4xl font-black text-white tracking-tight mb-1">
          EatLog
        </h1>
        <p className="text-zinc-500 text-sm mb-10">
          Track calories & protein in seconds.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            id="auth-email"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-surface-2 text-white placeholder-zinc-600 rounded-xl px-4 py-3.5 text-base outline-none focus:ring-1 focus:ring-zinc-700 transition-colors"
          />
          <input
            id="auth-password"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full bg-surface-2 text-white placeholder-zinc-600 rounded-xl px-4 py-3.5 text-base outline-none focus:ring-1 focus:ring-zinc-700 transition-colors"
          />

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <button
            id="auth-submit"
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black font-semibold rounded-xl py-3.5 text-base active:scale-[0.98] transition-transform disabled:opacity-40"
          >
            {loading ? '...' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        {/* Toggle */}
        <button
          id="auth-toggle"
          onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
          className="mt-6 text-zinc-500 text-sm w-full text-center active:text-zinc-300 transition-colors"
        >
          {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
        </button>
      </div>
    </div>
  );
}
