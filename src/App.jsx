import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './firebase';
import AuthScreen from './components/AuthScreen';
import Dashboard from './components/Dashboard';
import LandingPage from './components/LandingPage';
import OnboardingScreen from './components/OnboardingScreen';
import { ToastProvider } from './components/Toast';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { Analytics } from '@vercel/analytics/react';

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(undefined); // undefined = loading, null = no profile
  const [skippedOnboarding, setSkippedOnboarding] = useState(false);
  
  // view: 'auto' | 'landing' | 'dashboard' | 'auth' | 'onboarding'
  const [view, setView] = useState(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash === '#auth' || window.location.search.includes('auth=true')) return 'auth';
      if (hash === '#landing') return 'landing';
      if (hash === '#onboarding') return 'onboarding';
      if (hash === '#app' || hash === '#dashboard') return 'dashboard';
    }
    return 'auto';
  });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#auth') {
        setView('auth');
      } else if (hash === '#landing') {
        setView('landing');
      } else if (hash === '#onboarding') {
        setView('onboarding');
      } else if (hash === '#app' || hash === '#dashboard') {
        setView('dashboard');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    let unsubProfile = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);

      if (currentUser?.uid) {
        const profileRef = doc(db, 'user_profiles', currentUser.uid);
        unsubProfile = onSnapshot(
          profileRef,
          (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              if (data?.height_cm && data?.age && (data?.current_weight_kg || data?.baseline_weight_kg)) {
                setUserProfile(data);
              } else {
                setUserProfile(null);
              }
            } else {
              setUserProfile(null);
            }
          },
          (err) => {
            console.warn('Profile listener error in App.jsx:', err);
            setUserProfile(null);
          }
        );
      } else {
        setUserProfile(undefined);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubProfile();
    };
  }, []);

  const navigateTo = (target) => {
    setView(target);
    if (target === 'landing') {
      window.location.hash = '#landing';
    } else if (target === 'dashboard') {
      window.location.hash = '#app';
    } else if (target === 'onboarding') {
      window.location.hash = '#onboarding';
    } else if (target === 'auth') {
      window.location.hash = '#auth';
    }
  };

  // Determine active view:
  // If user is logged in but hasn't completed onboarding and hasn't skipped, route to onboarding
  const needsOnboarding = Boolean(user && userProfile === null && !skippedOnboarding);

  // Synchronize URL hash and view when user authenticates from #auth
  useEffect(() => {
    if (user && view === 'auth') {
      if (userProfile === null && !skippedOnboarding) {
        setView('onboarding');
        window.location.hash = '#onboarding';
      } else if (userProfile !== undefined) {
        setView('dashboard');
        window.location.hash = '#app';
      }
    }
  }, [user, userProfile, view, skippedOnboarding]);

  // Loading spinner during auth initialization or profile fetch
  if (authLoading || (user && userProfile === undefined && (view === 'auto' || view === 'auth' || view === 'dashboard' || view === 'onboarding'))) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-surface-0">
        <div className="w-9 h-9 border-2 border-macro-protein/20 border-t-macro-protein rounded-full animate-spin mb-3.5" />
        <div className="text-text-muted text-xs font-mono tracking-wider font-semibold animate-pulse">Initializing EatLog...</div>
      </div>
    );
  }

  let activeView = view;
  if (view === 'auto' || (view === 'auth' && user)) {
    if (user) {
      activeView = needsOnboarding ? 'onboarding' : 'dashboard';
    } else {
      activeView = 'landing';
    }
  } else if (view === 'dashboard' && needsOnboarding) {
    activeView = 'onboarding';
  }

  return (
    <ToastProvider>
      {activeView === 'auth' && !user ? (
        <AuthScreen onBack={() => navigateTo('landing')} onSuccess={() => navigateTo(needsOnboarding ? 'onboarding' : 'dashboard')} />
      ) : activeView === 'onboarding' && user ? (
        <OnboardingScreen
          onComplete={() => {
            setSkippedOnboarding(true);
            navigateTo('dashboard');
          }}
          onSkip={() => {
            setSkippedOnboarding(true);
            navigateTo('dashboard');
          }}
        />
      ) : activeView === 'landing' ? (
        <LandingPage
          user={user}
          onGetStarted={() => navigateTo(user ? (needsOnboarding ? 'onboarding' : 'dashboard') : 'auth')}
          onSignIn={() => navigateTo(user ? (needsOnboarding ? 'onboarding' : 'dashboard') : 'auth')}
          onOpenDashboard={() => navigateTo(needsOnboarding ? 'onboarding' : 'dashboard')}
        />
      ) : (
        /* activeView === 'dashboard' */
        user ? (
          <Dashboard onNavigateToLanding={() => navigateTo('landing')} />
        ) : (
          <LandingPage
            user={null}
            onGetStarted={() => navigateTo('auth')}
            onSignIn={() => navigateTo('auth')}
            onOpenDashboard={() => navigateTo('auth')}
          />
        )
      )}
      <SpeedInsights />
      <Analytics />
    </ToastProvider>
  );
}
