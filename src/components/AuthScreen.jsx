import { useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path
        fill="#EA4335"
        d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
      />
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
      />
      <path
        fill="#FBBC05"
        d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8s.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.8 0 12s.7 3.3 1.9 5.7l3.7-2.9z"
      />
      <path
        fill="#34A853"
        d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z"
      />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function EyeSlashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  );
}

export default function AuthScreen({ onBack, onSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('[Firebase Auth Error]:', err);
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

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      await signInWithPopup(auth, googleProvider);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('[Firebase Google Auth Error]:', {
        code: err.code,
        message: err.message,
        error: err,
      });
      if (err.code !== 'auth/popup-closed-by-user') {
        const messages = {
          'auth/operation-not-allowed':
            'Google Sign-In is disabled. Enable Google provider in Firebase Console (Authentication > Sign-in method).',
          'auth/account-exists-with-different-credential':
            'An account already exists with this email address using a different sign-in method.',
          'auth/unauthorized-domain':
            'This domain is not authorized in Firebase Console (Authentication > Settings > Authorized domains).',
          'auth/popup-blocked':
            'Popup blocked by browser. Please allow popups for this site.',
        };
        setError(messages[err.code] || `Google Sign-In failed (${err.code}): ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-surface-0 px-6 py-12 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-gradient-to-b from-macro-protein/10 via-macro-water/5 to-transparent blur-[120px] rounded-full pointer-events-none" />

      {onBack && (
        <button
          id="auth-back-btn"
          type="button"
          onClick={onBack}
          className="absolute top-6 left-6 text-xs text-text-muted hover:text-text-primary flex items-center gap-1.5 transition-colors font-medium px-3.5 py-2 rounded-xl bg-surface-1 border border-border/80 hover:border-border hover:bg-surface-2 active:scale-95"
        >
          <span>←</span>
          <span>Back to Overview</span>
        </button>
      )}

      <div className="w-full max-w-sm relative z-10 bg-surface-1 border border-border/80 rounded-3xl p-6 sm:p-8 shadow-2xl">
        {/* Brand */}
        <div className="flex items-center gap-2.5 mb-1.5">
          <div className="w-3 h-3 rounded-full bg-macro-protein shadow-[0_0_12px_rgba(34,197,94,0.6)] animate-pulse" />
          <h1 className="text-3xl sm:text-4xl font-black text-text-primary tracking-tight">
            EatLog
          </h1>
        </div>
        <p className="text-text-muted text-xs sm:text-sm mb-7">
          Hyper-precise nutrition tracking in seconds.
        </p>

        {/* Google Sign-In Button */}
        <button
          type="button"
          id="google-auth-btn"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-surface-2 hover:bg-surface-3 border border-border/80 hover:border-border text-text-primary font-semibold rounded-2xl py-3.5 px-4 text-sm active:scale-[0.98] transition-all disabled:opacity-40 shadow-sm"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-text-muted border-t-text-primary rounded-full animate-spin" />
              <span>Connecting...</span>
            </>
          ) : (
            <>
              <GoogleIcon />
              <span>Continue with Google</span>
            </>
          )}
        </button>

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-1 border-t border-border/60" />
          <span className="px-3 text-[11px] uppercase tracking-wider text-text-dim font-mono font-medium">
            or email
          </span>
          <div className="flex-1 border-t border-border/60" />
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              id="auth-email"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-surface-2 text-text-primary placeholder:text-text-dim rounded-2xl px-4 py-3.5 text-sm outline-none border border-border/80 focus:border-macro-protein focus:ring-1 focus:ring-macro-protein/30 transition-all font-sans"
            />
          </div>

          {/* Password with Eye Toggle */}
          <div className="relative">
            <input
              id="auth-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full bg-surface-2 text-text-primary placeholder:text-text-dim rounded-2xl pl-4 pr-12 py-3.5 text-sm outline-none border border-border/80 focus:border-macro-protein focus:ring-1 focus:ring-macro-protein/30 transition-all font-mono"
            />
            <button
              type="button"
              id="toggle-password-btn"
              onClick={() => setShowPassword(!showPassword)}
              title={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-primary transition-colors p-1.5 rounded-lg hover:bg-surface-3"
            >
              {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
            </button>
          </div>

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs leading-relaxed">
              {error}
            </div>
          )}

          <button
            id="auth-submit"
            type="submit"
            disabled={loading}
            className="w-full bg-macro-protein hover:bg-emerald-400 text-surface-0 font-bold rounded-2xl py-3.5 text-sm active:scale-[0.98] transition-all disabled:opacity-40 shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_28px_rgba(34,197,94,0.45)] flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-surface-0/30 border-t-surface-0 rounded-full animate-spin" />
                <span>{isSignUp ? 'Creating Account...' : 'Signing In...'}</span>
              </>
            ) : isSignUp ? (
              'Create Account'
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Toggle */}
        <button
          type="button"
          id="auth-toggle"
          onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
          className="mt-6 text-text-muted text-xs sm:text-sm w-full text-center hover:text-text-primary transition-colors font-medium py-1"
        >
          {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
        </button>
      </div>
    </div>
  );
}
