import { useState, useEffect, useRef } from 'react';
import { signOut } from 'firebase/auth';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import WaterTracker from './WaterTracker';
import WeightTracker from './WeightTracker';
import WeeklyView from './WeeklyView';
import Profile from './Profile';
import MealCard from './MealCard';
import LookupPanel from './LookupPanel';
import DatePicker from './DatePicker';
import { calculateNutritionTargets } from '../utils/nutritionMath';
import { useToast } from './Toast';

// --- Icons (inline SVG) ---
function CameraIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M12 9a3.75 3.75 0 100 7.5A3.75 3.75 0 0012 9z" />
      <path fillRule="evenodd" d="M9.344 3.071a49.52 49.52 0 015.312 0c.967.052 1.83.585 2.332 1.39l.821 1.317c.2.32.58.522.984.522H19.5a3 3 0 013 3v7.5a3 3 0 01-3 3h-15a3 3 0 01-3-3V9.3a3 3 0 013-3h.757c.404 0 .784-.202.984-.522l.821-1.317a2.303 2.303 0 012.332-1.39zM12 7.5a5.25 5.25 0 100 10.5 5.25 5.25 0 000-10.5z" clipRule="evenodd" />
    </svg>
  );
}

function GalleryIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0021 18v-1.94l-2.69-2.689a1.5 1.5 0 00-2.12 0l-.88.879.97.97a.75.75 0 11-1.06 1.06l-5.16-5.159a1.5 1.5 0 00-2.12 0L3 16.061zm10.125-7.81a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z" clipRule="evenodd" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-zinc-400">
      <path fillRule="evenodd" d="M6.75 2.25A.75.75 0 017.5 3v1.5h9V3a.75.75 0 011.5 0v1.5h.75A3.75 3.75 0 0122.5 8.25v10.5A3.75 3.75 0 0118.75 22.5H5.25A3.75 3.75 0 011.5 18.75V8.25A3.75 3.75 0 015.25 4.5h.75V3a.75.75 0 01.75-.75zm13.5 9a1.5 1.5 0 00-1.5-1.5H5.25a1.5 1.5 0 00-1.5 1.5v7.5a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5v-7.5z" clipRule="evenodd" />
    </svg>
  );
}

// --- Helpers ---
function formatLocalDate(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDateBounds(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const start = new Date(year, month - 1, day, 0, 0, 0, 0);
  const end = new Date(year, month - 1, day, 23, 59, 59, 999);
  return { startISO: start.toISOString(), endISO: end.toISOString() };
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const img = new Image();
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target.result;
    };
    img.onload = () => {
      const maxDimension = 1024;
      let width = img.width;
      let height = img.height;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
      resolve(dataUrl.split(',')[1]);
    };
    img.onerror = reject;
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function Dashboard({ onNavigateToLanding }) {
  const { showToast } = useToast();
  const todayStr = formatLocalDate(new Date());
  const [currentTab, setCurrentTab] = useState('daily'); // 'daily' | 'weekly' | 'profile' | 'lookup'
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [dailyLogs, setDailyLogs] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [currentWeight, setCurrentWeight] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [inputText, setInputText] = useState('');
  const [showStaplesModal, setShowStaplesModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [isDateLoading, setIsDateLoading] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const inputRef = useRef(null);

  // 1. Real-time listener for logs on selectedDate
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid || !selectedDate) return;

    setIsDateLoading(true);
    setDailyLogs([]);
    const { startISO, endISO } = getDateBounds(selectedDate);

    const q = query(
      collection(db, 'daily_logs'),
      where('user_id', '==', uid),
      where('timestamp', '>=', startISO),
      where('timestamp', '<=', endISO),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const logs = snapshot.docs.map((doc) => ({ docId: doc.id, ...doc.data() }));
        setDailyLogs(logs);
        setIsDateLoading(false);
      },
      (error) => {
        console.error('Firestore listener error:', error);
        setIsDateLoading(false);
      }
    );

    return unsubscribe;
  }, [selectedDate]);

  // 2. Real-time listener for user profile
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const profileRef = doc(db, 'user_profiles', uid);
    const unsubProfile = onSnapshot(
      profileRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setUserProfile(docSnap.data());
        } else {
          setUserProfile(null);
        }
      },
      (error) => {
        console.error('UserProfile listener error:', error);
      }
    );

    return unsubProfile;
  }, []);

  // 3. Real-time listener for selectedDate's weight log
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid || !selectedDate) return;

    const weightRef = doc(db, 'weight_logs', `${uid}_${selectedDate}`);
    const unsubWeight = onSnapshot(
      weightRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setCurrentWeight(docSnap.data().weight_kg);
        } else {
          setCurrentWeight(null);
        }
      },
      (error) => {
        console.error('Weight listener error:', error);
      }
    );

    return unsubWeight;
  }, [selectedDate]);

  // Primary & Secondary Totals for selected date
  const totalCalories = dailyLogs.reduce((sum, log) => sum + (Number(log.calories) || 0), 0);
  const totalProtein = dailyLogs.reduce((sum, log) => sum + (Number(log.protein_g) || 0), 0);
  const totalCarbs = dailyLogs.reduce((sum, log) => sum + (Number(log.carbs_g) || 0), 0);
  const totalFat = dailyLogs.reduce((sum, log) => sum + (Number(log.fat_g) || 0), 0);
  const totalFiber = dailyLogs.reduce((sum, log) => sum + (Number(log.fiber_g) || 0), 0);

  // Staples derived from user profile (synced via real-time listener)
  const staples = userProfile?.staples || [];

  // Dynamic Targets Calculation with graceful fallbacks (2500 kcal / 150g protein)
  const targets = calculateNutritionTargets(userProfile || {}, currentWeight);

  // Submit handler with retroactive noon timestamp
  const submitToAPI = async (payload, inputMethod) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/logMeal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const data = await res.json();

      if (!data.is_valid) {
        showToast(data.error_message || 'Could not identify the food.', 'error');
        return;
      }

      // Use actual current time for today; noon for retroactive entries
      const todayCheck = formatLocalDate(new Date());
      let timestamp;
      if (selectedDate === todayCheck) {
        timestamp = new Date().toISOString();
      } else {
        const [year, month, day] = selectedDate.split('-').map(Number);
        const noonDate = new Date(year, month - 1, day, 12, 0, 0);
        timestamp = noonDate.toISOString();
      }

      // Write to Firestore daily_logs
      await addDoc(collection(db, 'daily_logs'), {
        id: crypto.randomUUID(),
        user_id: auth.currentUser.uid,
        timestamp: timestamp,
        food_summary: data.food_summary,
        calories: Number(data.calories) || 0,
        protein_g: Number(data.protein_g) || 0,
        carbs_g: Number(data.carbs_g) || 0,
        fat_g: Number(data.fat_g) || 0,
        fiber_g: Number(data.fiber_g) || 0,
        input_method: inputMethod,
      });

      setInputText('');
      showToast(`Logged: ${data.food_summary}`, 'success');
    } catch (err) {
      console.error('Submission error:', err);
      showToast('Something went wrong. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTextSubmit = (e) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || isLoading) return;
    submitToAPI({ text: trimmed }, 'text');
  };

  const handleImageCapture = async (e) => {
    const file = e.target.files?.[0];
    if (!file || isLoading) return;

    try {
      const base64 = await fileToBase64(file);
      await submitToAPI({ image: base64 }, 'vision');
    } catch (err) {
      console.error('Image processing error:', err);
      showToast('Failed to process image.', 'error');
    }

    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- Staples: Pin / Unpin / Re-log ---
  const handlePinStaple = async (log) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const staplePayload = {
      food_summary: log.food_summary,
      calories: Number(log.calories) || 0,
      protein_g: Number(log.protein_g) || 0,
      carbs_g: Number(log.carbs_g) || 0,
      fat_g: Number(log.fat_g) || 0,
      fiber_g: Number(log.fiber_g) || 0,
    };

    const alreadyPinned = staples.some(
      (s) => s.food_summary === log.food_summary
    );

    try {
      const profileRef = doc(db, 'user_profiles', uid);
      if (alreadyPinned) {
        const toRemove = staples.find(
          (s) => s.food_summary === log.food_summary
        );
        await updateDoc(profileRef, { staples: arrayRemove(toRemove) });
        showToast('Removed from staples.', 'info');
      } else {
        await updateDoc(profileRef, { staples: arrayUnion(staplePayload) });
        showToast('Pinned to staples!', 'success');
      }
    } catch (err) {
      console.error('Error updating staples:', err);
      showToast('Failed to update staples.', 'error');
    }
  };

  const handleRelogStaple = async (staple) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const todayCheck = formatLocalDate(new Date());
    let timestamp;
    if (selectedDate === todayCheck) {
      timestamp = new Date().toISOString();
    } else {
      const [year, month, day] = selectedDate.split('-').map(Number);
      const noonDate = new Date(year, month - 1, day, 12, 0, 0);
      timestamp = noonDate.toISOString();
    }

    try {
      await addDoc(collection(db, 'daily_logs'), {
        id: crypto.randomUUID(),
        user_id: uid,
        timestamp: timestamp,
        food_summary: staple.food_summary,
        calories: Number(staple.calories) || 0,
        protein_g: Number(staple.protein_g) || 0,
        carbs_g: Number(staple.carbs_g) || 0,
        fat_g: Number(staple.fat_g) || 0,
        fiber_g: Number(staple.fiber_g) || 0,
        input_method: 'staple',
      });
      showToast(`Re-logged: ${staple.food_summary}`, 'success');
    } catch (err) {
      console.error('Staple re-log error:', err);
      showToast('Failed to re-log staple.', 'error');
    }
  };

  const handleLogMealItem = async (item, inputMethod = 'lookup') => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const todayCheck = formatLocalDate(new Date());
    let timestamp;
    if (selectedDate === todayCheck) {
      timestamp = new Date().toISOString();
    } else {
      const [year, month, day] = selectedDate.split('-').map(Number);
      const noonDate = new Date(year, month - 1, day, 12, 0, 0);
      timestamp = noonDate.toISOString();
    }

    try {
      await addDoc(collection(db, 'daily_logs'), {
        id: crypto.randomUUID(),
        user_id: uid,
        timestamp: timestamp,
        food_summary: item.food_summary,
        calories: Number(item.calories) || 0,
        protein_g: Number(item.protein_g) || 0,
        carbs_g: Number(item.carbs_g) || 0,
        fat_g: Number(item.fat_g) || 0,
        fiber_g: Number(item.fiber_g) || 0,
        input_method: inputMethod,
      });
      showToast(`Logged: ${item.food_summary}`, 'success');
    } catch (err) {
      console.error('Error logging meal item:', err);
      showToast('Failed to log meal.', 'error');
    }
  };

  const isToday = selectedDate === todayStr;
  const displayDateTitle = isToday
    ? "Today's Intake"
    : new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        weekday: 'short',
      });

  const caloriePercent = Math.min(100, Math.round((totalCalories / targets.targetCalories) * 100));
  const proteinPercent = Math.min(100, Math.round((totalProtein / targets.targetMacros.protein_g) * 100));
  const carbsPercent = Math.min(100, Math.round((totalCarbs / (targets.targetMacros.carbs_g || 1)) * 100));
  const fatPercent = Math.min(100, Math.round((totalFat / (targets.targetMacros.fat_g || 1)) * 100));
  const fiberPercent = Math.min(100, Math.round((totalFiber / (targets.targetMacros.fiber_g || 1)) * 100));

  const calorieSurplus = totalCalories - targets.targetCalories;
  const proteinSurplus = totalProtein - targets.targetMacros.protein_g;

  return (
    <div className="min-h-screen bg-[#090a0c] text-[#f3f4f6] flex flex-col relative selection:bg-[#22c55e]/20 selection:text-[#22c55e]">
      {/* Top Header */}
      <header className="px-4 sm:px-6 lg:px-8 py-3 sm:py-3.5 border-b border-white/[0.07] bg-[#090a0c]/90 backdrop-blur-xl sticky top-0 z-40 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <button
              id="nav-to-landing-btn"
              type="button"
              onClick={() => {
                if (onNavigateToLanding) onNavigateToLanding();
                else window.location.hash = '#landing';
              }}
              title="View Landing Page & Features"
              className="flex items-center gap-2.5 group text-left cursor-pointer transition-transform active:scale-95 bg-transparent border-0 p-0"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-[#22c55e] shadow-[0_0_12px_rgba(34,197,94,0.6)] group-hover:scale-125 transition-transform animate-pulse" />
              <h1 className="text-lg sm:text-xl font-black text-[#f3f4f6] tracking-tight shrink-0 flex items-center gap-1.5 group-hover:text-emerald-400 transition-colors">
                <span>EatLog</span>
              </h1>
            </button>
          </div>
          
          {/* Tab Switcher: Daily | Weekly | Profile | Lookup */}
          <nav aria-label="Main Navigation" className="flex items-center bg-[#15171b] p-1 rounded-xl border border-white/[0.07] gap-0.5 sm:gap-1 shadow-inner">
            <button
              id="tab-daily"
              onClick={() => setCurrentTab('daily')}
              className={`px-3 py-1.5 sm:px-4 rounded-lg text-xs font-semibold transition-all active:scale-95 ${
                currentTab === 'daily'
                  ? 'bg-[#f3f4f6] text-[#090a0c] shadow-md'
                  : 'text-[#9ca3af] hover:text-[#f3f4f6] hover:bg-white/[0.04]'
              }`}
            >
              Daily
            </button>
            <button
              id="tab-weekly"
              onClick={() => setCurrentTab('weekly')}
              className={`px-3 py-1.5 sm:px-4 rounded-lg text-xs font-semibold transition-all active:scale-95 ${
                currentTab === 'weekly'
                  ? 'bg-[#f3f4f6] text-[#090a0c] shadow-md'
                  : 'text-[#9ca3af] hover:text-[#f3f4f6] hover:bg-white/[0.04]'
              }`}
            >
              Weekly
            </button>
            <button
              id="tab-profile"
              onClick={() => setCurrentTab('profile')}
              className={`px-3 py-1.5 sm:px-4 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 active:scale-95 ${
                currentTab === 'profile'
                  ? 'bg-[#f3f4f6] text-[#090a0c] shadow-md'
                  : 'text-[#9ca3af] hover:text-[#f3f4f6] hover:bg-white/[0.04]'
              }`}
            >
              <span>Goals</span>
              {targets.hasProfile && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] inline-block shadow-[0_0_6px_rgba(34,197,94,0.6)]" />
              )}
            </button>
            <button
              id="tab-lookup"
              onClick={() => setCurrentTab('lookup')}
              className={`px-3 py-1.5 sm:px-4 rounded-lg text-xs font-semibold transition-all active:scale-95 ${
                currentTab === 'lookup'
                  ? 'bg-[#38bdf8] text-[#090a0c] shadow-md'
                  : 'text-[#9ca3af] hover:text-[#38bdf8] hover:bg-white/[0.04]'
              }`}
            >
              Lookup
            </button>
          </nav>

          <button
            id="sign-out-btn"
            onClick={() => signOut(auth)}
            className="text-[#6b7280] hover:text-[#f3f4f6] text-xs font-medium shrink-0 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-white/[0.05]"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full">
        {currentTab === 'lookup' ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <LookupPanel onAddMeal={handleLogMealItem} />
          </div>
        ) : currentTab === 'weekly' ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <WeeklyView />
          </div>
        ) : currentTab === 'profile' ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <Profile latestWeightKg={currentWeight || userProfile?.current_weight_kg} />
          </div>
        ) : (
          <div className="max-w-7xl mx-auto w-full px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6">
            {/* Desktop 2-Column Command Center / Mobile 1-Column Stack */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
              
              {/* Left Column: Daily HUD & Quick Trackers (Sticky on Desktop) */}
              <aside className={`lg:col-span-5 xl:col-span-4 lg:sticky lg:top-24 space-y-3.5 sm:space-y-4 transition-opacity duration-200 ${isDateLoading ? 'opacity-40' : 'opacity-100'}`}>
                {/* Header info */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#9ca3af] text-xs font-semibold uppercase tracking-wider truncate font-mono">
                    {displayDateTitle}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    {targets.hasProfile ? (
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#15171b] text-[#f3f4f6] font-medium border border-white/[0.08] font-stat-mono shadow-inner">
                        BMI {targets.bmi} • {targets.goal?.toUpperCase()}
                      </span>
                    ) : (
                      <button
                        onClick={() => setCurrentTab('profile')}
                        className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-950/40 text-[#facc15] hover:text-amber-300 font-semibold border border-amber-800/40 transition-colors"
                      >
                        Set up targets →
                      </button>
                    )}
                    {!isToday && (
                      <button
                        onClick={() => setSelectedDate(todayStr)}
                        className="text-xs text-[#38bdf8] font-semibold hover:underline font-mono"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>

                {/* Primary Macro HUD: 2 Hero Cards (Calories & Protein) */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {/* Calories Card */}
                  <div className="bg-[#121316] rounded-2xl p-4 border border-white/[0.08] border-t-2 border-t-[#facc15] shadow-[0_4px_16px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.04)] transition-all hover:border-white/[0.15]">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-[#9ca3af] text-[11px] font-semibold uppercase tracking-wider">Calories</p>
                      <span className="text-[#facc15] text-xs font-stat-mono font-bold">{caloriePercent}%</span>
                    </div>
                    <div className="flex items-baseline gap-1 flex-wrap">
                      <span className={`text-2xl sm:text-3xl font-extrabold font-stat-mono leading-none tracking-tight ${calorieSurplus > 0 ? 'text-rose-400' : 'text-[#f3f4f6]'}`}>
                        {totalCalories}
                      </span>
                      <span className="text-xs text-[#6b7280] font-stat-mono font-medium">
                        / {targets.targetCalories} kcal
                      </span>
                      {calorieSurplus > 0 && (
                        <span className="text-[10px] text-rose-400 font-semibold font-stat-mono w-full mt-0.5">+{calorieSurplus} over</span>
                      )}
                    </div>
                    {/* Progress Bar with Glow */}
                    <div className="w-full bg-[#1a1c22] h-2 rounded-full mt-3 overflow-hidden shadow-inner">
                      <div
                        className={`${calorieSurplus > 0 ? 'bg-rose-500' : 'bg-[#facc15] progress-glow-calories'} h-full rounded-full progress-fill`}
                        style={{ width: `${caloriePercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Protein Card */}
                  <div className="bg-[#121316] rounded-2xl p-4 border border-white/[0.08] border-t-2 border-t-[#22c55e] shadow-[0_4px_16px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.04)] transition-all hover:border-white/[0.15]">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-[#9ca3af] text-[11px] font-semibold uppercase tracking-wider">Protein</p>
                      <span className="text-[#22c55e] text-xs font-stat-mono font-bold">{proteinPercent}%</span>
                    </div>
                    <div className="flex items-baseline gap-1 flex-wrap">
                      <span className={`text-2xl sm:text-3xl font-extrabold font-stat-mono leading-none tracking-tight ${proteinSurplus > 0 ? 'text-emerald-300' : 'text-[#f3f4f6]'}`}>
                        {totalProtein}
                      </span>
                      <span className="text-xs text-[#6b7280] font-stat-mono font-medium">
                        / {targets.targetMacros.protein_g}g
                      </span>
                      {proteinSurplus > 0 && (
                        <span className="text-[10px] text-emerald-400 font-semibold font-stat-mono w-full mt-0.5">+{proteinSurplus}g over</span>
                      )}
                    </div>
                    {/* Progress Bar with Glow */}
                    <div className="w-full bg-[#1a1c22] h-2 rounded-full mt-3 overflow-hidden shadow-inner">
                      <div
                        className="bg-[#22c55e] progress-glow-protein h-full rounded-full progress-fill"
                        style={{ width: `${proteinPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Secondary Macro Strip (Carbs, Fat, Fiber) */}
                <div className="grid grid-cols-3 gap-2 px-4 py-3 bg-[#121316] rounded-2xl border border-white/[0.07] shadow-sm">
                  <div>
                    <p className="text-[#9ca3af] text-[10px] font-semibold uppercase tracking-wider">Carbs</p>
                    <p className="text-sm font-bold text-[#38bdf8] font-stat-mono mt-0.5">
                      {totalCarbs}<span className="text-[10px] text-[#6b7280] font-normal ml-0.5">/ {targets.targetMacros.carbs_g}g</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-[#9ca3af] text-[10px] font-semibold uppercase tracking-wider">Fat</p>
                    <p className="text-sm font-bold text-[#fb923c] font-stat-mono mt-0.5">
                      {totalFat}<span className="text-[10px] text-[#6b7280] font-normal ml-0.5">/ {targets.targetMacros.fat_g}g</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-[#9ca3af] text-[10px] font-semibold uppercase tracking-wider">Fiber</p>
                    <p className="text-sm font-bold text-[#a78bfa] font-stat-mono mt-0.5">
                      {totalFiber}<span className="text-[10px] text-[#6b7280] font-normal ml-0.5">/ {targets.targetMacros.fiber_g}g</span>
                    </p>
                  </div>
                </div>

                {/* Quick Trackers: Water & Weight */}
                <div className="space-y-2.5">
                  <WaterTracker selectedDate={selectedDate} />
                  <WeightTracker selectedDate={selectedDate} />
                </div>
              </aside>

              {/* Right Column: Meals Feed */}
              <section className="lg:col-span-7 xl:col-span-8 space-y-3.5 pb-36 lg:pb-32">
                {/* Section Header */}
                <div className="flex items-center justify-between pb-2 border-b border-white/[0.07]">
                  <span className="text-[#6b7280] text-xs font-semibold uppercase tracking-wider font-mono">
                    Meals ({dailyLogs.length})
                  </span>
                  {dailyLogs.length > 0 && (
                    <span className="text-[#9ca3af] text-xs font-stat-mono font-medium">
                      {totalCalories} kcal total
                    </span>
                  )}
                </div>

                {/* Meal Cards Stream */}
                {isDateLoading && (
                  <div className="space-y-2.5 animate-pulse-slow">
                    <div className="bg-[#121316] rounded-2xl h-16 border border-white/[0.06]" />
                    <div className="bg-[#121316] rounded-2xl h-16 border border-white/[0.06]" />
                    <div className="bg-[#121316] rounded-2xl h-12 border border-white/[0.06] w-3/4" />
                  </div>
                )}

                {!isDateLoading && dailyLogs.length === 0 && !isLoading && (
                  <div className="text-center py-12 px-6 bg-[#121316]/60 rounded-3xl border border-white/[0.06] my-2">
                    <div className="w-14 h-14 rounded-2xl bg-[#15171b] border border-white/[0.08] flex items-center justify-center mx-auto mb-3 text-xl shadow-inner">
                      🍽️
                    </div>
                    <p className="text-[#f3f4f6] text-base font-semibold">
                      No meals logged for {isToday ? 'today' : displayDateTitle}.
                    </p>
                    <p className="text-[#6b7280] text-xs mt-1.5 max-w-sm mx-auto leading-relaxed">
                      Type your meal below in plain English, capture a food photo, or quickly re-log from your pinned Staples.
                    </p>
                  </div>
                )}

                <div className="space-y-2.5">
                  {dailyLogs.map((log) => (
                    <MealCard
                      key={log.docId}
                      log={log}
                      onPinStaple={handlePinStaple}
                      isPinned={staples.some((s) => s.food_summary === log.food_summary)}
                    />
                  ))}
                </div>
              </section>
            </div>
          </div>
        )}
      </main>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#121316] px-6 py-4 rounded-2xl border border-white/[0.15] text-[#f3f4f6] text-sm font-medium animate-pulse-slow shadow-2xl flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-[#22c55e] shadow-[0_0_12px_rgba(34,197,94,0.8)] animate-ping" />
            <span>Analyzing meal with AI...</span>
          </div>
        </div>
      )}

      {/* Staples Modal */}
      {showStaplesModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center z-50 p-0 sm:p-4" onClick={() => setShowStaplesModal(false)}>
          <div
            className="w-full max-w-lg bg-[#121316] border-t sm:border border-white/[0.1] rounded-t-[28px] sm:rounded-3xl p-5 pb-8 sm:pb-6 lookup-card-enter shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/[0.07]">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-[#facc15]">
                  <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
                </svg>
                <h3 className="text-[#f3f4f6] text-base font-bold tracking-tight">My Staples</h3>
                <span className="text-[#6b7280] text-xs font-mono">{staples.length} item{staples.length !== 1 ? 's' : ''}</span>
              </div>
              <button
                onClick={() => setShowStaplesModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-[#9ca3af] hover:text-[#f3f4f6] hover:bg-white/[0.08] transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            </div>

            {/* Staples List */}
            {staples.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-[#9ca3af] text-sm font-medium">No staples pinned yet.</p>
                <p className="text-[#6b7280] text-xs mt-1">Tap the ⭐ on any logged meal to pin it here.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {staples.map((staple, idx) => (
                  <div
                    key={`${staple.food_summary}-${idx}`}
                    className="flex items-center gap-3 bg-[#15171b] rounded-2xl p-3.5 border border-white/[0.07] hover:border-white/[0.15] transition-all"
                  >
                    {/* Tap to re-log */}
                    <button
                      onClick={() => {
                        handleRelogStaple(staple);
                        setShowStaplesModal(false);
                      }}
                      className="flex-1 text-left min-w-0 active:scale-[0.98] transition-transform"
                    >
                      <p className="text-[#f3f4f6] text-sm font-semibold truncate">{staple.food_summary}</p>
                      <div className="flex items-center gap-3 mt-1 font-stat-mono">
                        <span className="text-[#facc15] text-xs font-semibold">{staple.calories} cal</span>
                        <span className="text-[#22c55e] text-xs">{staple.protein_g}g pro</span>
                        <span className="text-[#38bdf8] text-xs">{staple.carbs_g}g carb</span>
                        <span className="text-[#fb923c] text-xs">{staple.fat_g}g fat</span>
                      </div>
                    </button>
                    {/* Unpin button */}
                    <button
                      onClick={() => handlePinStaple(staple)}
                      title="Remove from staples"
                      className="shrink-0 w-8 h-8 flex items-center justify-center rounded-xl text-amber-400 hover:text-rose-400 hover:bg-white/[0.08] transition-all"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Hint */}
            {staples.length > 0 && (
              <p className="text-[#6b7280] text-[10px] text-center mt-3 font-mono">Tap any staple to instantly log it</p>
            )}
          </div>
        </div>
      )}

      {/* Date Picker Modal */}
      <DatePicker
        isOpen={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
      />

      {/* Photo Source Action Sheet / Modal */}
      {showPhotoOptions && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
          onClick={() => setShowPhotoOptions(false)}
        >
          <div
            className="w-full max-w-sm bg-[#121316] border-t sm:border border-white/[0.1] rounded-t-[28px] sm:rounded-3xl p-5 pb-8 sm:pb-6 lookup-card-enter shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/[0.07]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#38bdf8] animate-pulse" />
                <h3 className="text-[#f3f4f6] text-sm font-bold tracking-tight">Log Food from Photo</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPhotoOptions(false)}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-[#9ca3af] hover:text-[#f3f4f6] hover:bg-white/[0.08] transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            </div>

            {/* Action Options */}
            <div className="space-y-2.5">
              <button
                type="button"
                id="take-photo-btn"
                onClick={() => {
                  setShowPhotoOptions(false);
                  cameraInputRef.current?.click();
                }}
                className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl bg-[#181a1f] hover:bg-[#22252c] active:scale-[0.98] transition-all border border-white/[0.08] hover:border-sky-500/40 text-left group"
              >
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <CameraIcon />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[#f3f4f6] text-sm font-semibold">Take Photo</div>
                  <div className="text-[#9ca3af] text-xs">Open camera to capture meal or nutrition label</div>
                </div>
              </button>

              <button
                type="button"
                id="choose-gallery-btn"
                onClick={() => {
                  setShowPhotoOptions(false);
                  galleryInputRef.current?.click();
                }}
                className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl bg-[#181a1f] hover:bg-[#22252c] active:scale-[0.98] transition-all border border-white/[0.08] hover:border-emerald-500/40 text-left group"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <GalleryIcon />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[#f3f4f6] text-sm font-semibold">Choose from Gallery</div>
                  <div className="text-[#9ca3af] text-xs">Pick from photos, library, or files</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Omni-Input Bar (Clean Floating Dock on Desktop and Mobile) */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#090a0c]/90 backdrop-blur-2xl border-t border-white/[0.08] px-3 sm:px-6 py-2.5 sm:py-3 safe-area-pb z-30 shadow-[0_-12px_36px_rgba(0,0,0,0.8)]">
        <form onSubmit={handleTextSubmit} className="max-w-4xl mx-auto flex items-center gap-1.5 sm:gap-2">
          {/* Date Selector Badge */}
          <button
            type="button"
            onClick={() => setShowDatePicker(true)}
            title="Change logging date"
            className={`shrink-0 w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl active:scale-95 transition-all border ${
              selectedDate !== todayStr
                ? 'bg-sky-950/50 text-[#38bdf8] border-sky-800/50'
                : 'bg-[#15171b] text-[#9ca3af] hover:text-[#f3f4f6] border-white/[0.08] hover:border-white/[0.15]'
            }`}
          >
            <CalendarIcon />
          </button>

          {/* Camera / Photo Button */}
          <button
            id="camera-btn"
            type="button"
            onClick={() => setShowPhotoOptions(true)}
            disabled={isLoading}
            title="Log food from photo"
            className="relative z-10 shrink-0 w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl bg-[#15171b] text-[#9ca3af] hover:text-[#f3f4f6] active:scale-95 transition-all border border-white/[0.08] hover:border-white/[0.15] disabled:opacity-30"
          >
            <CameraIcon />
          </button>

          {/* Camera Direct Capture Input */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageCapture}
            className="hidden"
            id="camera-capture-input"
          />

          {/* Gallery / File Picker Input */}
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageCapture}
            className="hidden"
            id="gallery-upload-input"
          />

          {/* Fallback File Input ref for backward compatibility */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageCapture}
            className="hidden"
          />

          {/* Staples Button */}
          <button
            id="staples-btn"
            type="button"
            onClick={() => setShowStaplesModal(true)}
            disabled={isLoading}
            title="My Staples"
            className={`relative z-10 shrink-0 w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl active:scale-95 transition-all border disabled:opacity-30 ${
              staples.length > 0
                ? 'bg-amber-950/40 text-amber-400 border-amber-800/50'
                : 'bg-[#15171b] text-[#6b7280] border-white/[0.08] hover:border-white/[0.15] hover:text-amber-400'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
              <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
            </svg>
            {staples.length > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-[#facc15] text-[#090a0c] text-[9px] font-extrabold font-stat-mono shadow-sm">
                {staples.length}
              </span>
            )}
          </button>

          {/* Text Input */}
          <input
            ref={inputRef}
            id="meal-input"
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a meal or scan a plate/label..."
            disabled={isLoading}
            className="flex-1 min-w-0 bg-[#121316] text-[#f3f4f6] placeholder-[#6b7280] rounded-2xl px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-emerald-500/40 border border-white/[0.08] focus:border-emerald-500/60 transition-all disabled:opacity-30 font-sans"
          />

          {/* Submit Button */}
          <button
            id="submit-btn"
            type="submit"
            disabled={isLoading || !inputText.trim()}
            className="shrink-0 w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-2xl bg-[#22c55e] text-[#090a0c] hover:bg-emerald-400 active:scale-95 transition-all disabled:opacity-20 shadow-[0_0_14px_rgba(34,197,94,0.35)]"
          >
            <SendIcon />
          </button>
        </form>
      </div>
    </div>
  );
}
