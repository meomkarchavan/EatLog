import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import AuthScreen from './components/AuthScreen';
import Dashboard from './components/Dashboard';
import { ToastProvider } from './components/Toast';
import { SpeedInsights } from '@vercel/speed-insights/react';

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-black">
        <div className="text-zinc-500 text-lg animate-pulse-slow">EatLog</div>
      </div>
    );
  }

  return (
    <ToastProvider>
      {!user ? <AuthScreen /> : <Dashboard />}
      <SpeedInsights />
    </ToastProvider>
  );
}


