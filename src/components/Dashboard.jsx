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
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import WaterTracker from './WaterTracker';
import WeightTracker from './WeightTracker';
import WeeklyView from './WeeklyView';
import Profile from './Profile';
import MealCard from './MealCard';
import { calculateNutritionTargets } from '../utils/nutritionMath';

// --- Icons (inline SVG) ---
function CameraIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M12 9a3.75 3.75 0 100 7.5A3.75 3.75 0 0012 9z" />
      <path fillRule="evenodd" d="M9.344 3.071a49.52 49.52 0 015.312 0c.967.052 1.83.585 2.332 1.39l.821 1.317c.2.32.58.522.984.522H19.5a3 3 0 013 3v7.5a3 3 0 01-3 3h-15a3 3 0 01-3-3V9.3a3 3 0 013-3h.757c.404 0 .784-.202.984-.522l.821-1.317a2.303 2.303 0 012.332-1.39zM12 7.5a5.25 5.25 0 100 10.5 5.25 5.25 0 000-10.5z" clipRule="evenodd" />
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

export default function Dashboard() {
  const todayStr = formatLocalDate(new Date());
  const [currentTab, setCurrentTab] = useState('daily'); // 'daily' | 'weekly' | 'profile'
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [dailyLogs, setDailyLogs] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [currentWeight, setCurrentWeight] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [inputText, setInputText] = useState('');
  const fileInputRef = useRef(null);
  const dateInputRef = useRef(null);
  const inputRef = useRef(null);

  // 1. Real-time listener for logs on selectedDate
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid || !selectedDate) return;

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
      },
      (error) => {
        console.error('Firestore listener error:', error);
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
        alert(data.error_message || 'Could not identify the food.');
        return;
      }

      // Construct noon time for selected date to prevent timezone rollover
      const [year, month, day] = selectedDate.split('-').map(Number);
      const noonDate = new Date(year, month - 1, day, 12, 0, 0);
      const timestamp = noonDate.toISOString();

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
    } catch (err) {
      console.error('Submission error:', err);
      alert('Something went wrong. Please try again.');
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
      alert('Failed to process image.');
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
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

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Top Header */}
      <header className="px-5 pt-4 pb-2 border-b border-surface-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-black text-white tracking-tight">EatLog</h1>
          
          {/* Tab Switcher: Daily | Weekly | Profile */}
          <div className="flex items-center bg-surface-2 p-1 rounded-xl border border-surface-3">
            <button
              id="tab-daily"
              onClick={() => setCurrentTab('daily')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                currentTab === 'daily'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Daily
            </button>
            <button
              id="tab-weekly"
              onClick={() => setCurrentTab('weekly')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                currentTab === 'weekly'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Weekly
            </button>
            <button
              id="tab-profile"
              onClick={() => setCurrentTab('profile')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                currentTab === 'profile'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>Goals</span>
              {targets.hasProfile && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              )}
            </button>
          </div>

          <button
            id="sign-out-btn"
            onClick={() => signOut(auth)}
            className="text-zinc-600 text-xs font-medium active:text-zinc-400 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      {currentTab === 'weekly' ? (
        <WeeklyView />
      ) : currentTab === 'profile' ? (
        <Profile latestWeightKg={currentWeight} />
      ) : (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Daily HUD */}
          <section className="px-5 pt-4 pb-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-zinc-500 text-xs font-medium uppercase tracking-wider">
                {displayDateTitle}
              </span>
              <div className="flex items-center gap-2">
                {targets.hasProfile ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-surface-3 text-zinc-300 font-medium border border-zinc-700/50">
                    BMI {targets.bmi} • {targets.goal?.toUpperCase()}
                  </span>
                ) : (
                  <button
                    onClick={() => setCurrentTab('profile')}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-amber-950/30 text-amber-400 hover:text-amber-300 font-medium border border-amber-800/30 transition-colors"
                  >
                    Set up your profile targets →
                  </button>
                )}
                {!isToday && (
                  <button
                    onClick={() => setSelectedDate(todayStr)}
                    className="text-xs text-cyan-400 font-semibold hover:underline"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Primary Macro HUD with Dynamic Targets & Minimalist Progress Bars */}
            <div className="grid grid-cols-2 gap-4">
              {/* Calories Card */}
              <div className="bg-surface-2 rounded-2xl p-4 border border-surface-3">
                <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest mb-1">Calories</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white tabular-nums leading-none">
                    {totalCalories}
                  </span>
                  <span className="text-xs text-zinc-500 font-normal">
                    / {targets.targetCalories} kcal
                  </span>
                </div>
                {/* Minimal Progress Bar */}
                <div className="w-full bg-surface-3 h-1.5 rounded-full mt-2.5 overflow-hidden">
                  <div
                    className="bg-amber-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${caloriePercent}%` }}
                  />
                </div>
              </div>

              {/* Protein Card */}
              <div className="bg-surface-2 rounded-2xl p-4 border border-surface-3">
                <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest mb-1">Protein</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white tabular-nums leading-none">
                    {totalProtein}
                  </span>
                  <span className="text-xs text-zinc-500 font-normal">
                    / {targets.targetMacros.protein_g}g
                  </span>
                </div>
                {/* Minimal Progress Bar */}
                <div className="w-full bg-surface-3 h-1.5 rounded-full mt-2.5 overflow-hidden">
                  <div
                    className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${proteinPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Secondary Macro Row (Carbs, Fat, Fiber) */}
            <div className="flex gap-6 mt-3 pt-3 border-t border-surface-3/50">
              <div>
                <p className="text-zinc-500 text-[10px] font-medium uppercase tracking-wider">Carbs</p>
                <p className="text-base font-bold text-sky-400 tabular-nums">
                  {totalCarbs}<span className="text-xs font-normal text-zinc-500 ml-0.5">g</span>
                </p>
              </div>
              <div>
                <p className="text-zinc-500 text-[10px] font-medium uppercase tracking-wider">Fat</p>
                <p className="text-base font-bold text-rose-400 tabular-nums">
                  {totalFat}<span className="text-xs font-normal text-zinc-500 ml-0.5">g</span>
                </p>
              </div>
              <div>
                <p className="text-zinc-500 text-[10px] font-medium uppercase tracking-wider">Fiber</p>
                <p className="text-base font-bold text-lime-400 tabular-nums">
                  {totalFiber}<span className="text-xs font-normal text-zinc-500 ml-0.5">g</span>
                </p>
              </div>
            </div>

            {/* Quick Trackers Grid: Water & Morning Weight */}
            <div className="space-y-2 mt-3">
              <WaterTracker selectedDate={selectedDate} />
              <WeightTracker selectedDate={selectedDate} />
            </div>
          </section>

          {/* Divider */}
          <div className="h-px bg-surface-3 mx-5 mt-3" />

          {/* Log Feed */}
          <section className="flex-1 overflow-y-auto px-5 py-3 space-y-2 pb-28">
            {dailyLogs.length === 0 && !isLoading && (
              <p className="text-zinc-600 text-sm text-center mt-10">
                No meals logged for {isToday ? 'today' : displayDateTitle}.
              </p>
            )}

            {dailyLogs.map((log) => (
              <MealCard key={log.docId} log={log} />
            ))}
          </section>

          {/* Loading Overlay */}
          {isLoading && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50">
              <div className="bg-surface-2 px-6 py-4 rounded-2xl border border-surface-3 text-white text-base font-medium animate-pulse-slow">
                Analyzing meal with AI...
              </div>
            </div>
          )}

          {/* Omni-Input Bar with Date Picker */}
          <div className="fixed bottom-0 left-0 right-0 bg-surface-1 border-t border-surface-3 px-4 py-3 safe-area-pb">
            <form onSubmit={handleTextSubmit} className="flex items-center gap-2">
              {/* Date Selector Badge */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => dateInputRef.current?.showPicker ? dateInputRef.current.showPicker() : dateInputRef.current?.focus()}
                  title="Change logging date"
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-3 text-zinc-300 hover:text-white active:scale-95 transition-all border border-zinc-700/50"
                >
                  <CalendarIcon />
                </button>
                <input
                  ref={dateInputRef}
                  type="date"
                  value={selectedDate}
                  onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                  className="absolute inset-0 opacity-0 pointer-events-auto cursor-pointer"
                />
              </div>

              {/* Camera Button */}
              <button
                id="camera-btn"
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                title="Log food from photo"
                className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-surface-3 text-zinc-300 hover:text-white active:scale-95 transition-all border border-zinc-700/50 disabled:opacity-30"
              >
                <CameraIcon />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageCapture}
                className="hidden"
              />

              {/* Text Input */}
              <input
                ref={inputRef}
                id="meal-input"
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type a meal or scan a plate/label..."
                disabled={isLoading}
                className="flex-1 bg-surface-2 text-white placeholder-zinc-600 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-zinc-600 border border-surface-3 transition-colors disabled:opacity-30"
              />

              {/* Submit Button */}
              <button
                id="submit-btn"
                type="submit"
                disabled={isLoading || !inputText.trim()}
                className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-white text-black active:scale-95 transition-all disabled:opacity-20 flex items-center justify-center"
              >
                <SendIcon />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
