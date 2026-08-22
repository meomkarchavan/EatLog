import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import {
  calculateTargets,
  ACTIVITY_MODIFIERS,
  GOAL_MODIFIERS,
} from '../utils/targetEngine';
import { useToast } from './Toast';

export default function ProfileScreen({ latestWeightKg }) {
  const { showToast } = useToast();
  const [profile, setProfile] = useState({
    height_cm: '',
    age: '',
    gender: 'M',
    activity_level: 'moderate',
    goal: 'maintain',
    baseline_weight_kg: '',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const docRef = doc(db, 'user_profiles', uid);
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProfile({
            height_cm: data.height_cm ? String(data.height_cm) : '',
            age: data.age ? String(data.age) : '',
            gender: data.gender || 'M',
            activity_level: data.activity_level || 'moderate',
            goal: data.goal || 'maintain',
            baseline_weight_kg: data.baseline_weight_kg ? String(data.baseline_weight_kg) : '',
          });
        }
        setIsLoading(false);
      },
      (error) => {
        console.error('Profile listener error:', error);
        setIsLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const targets = calculateTargets(profile, latestWeightKg);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const docRef = doc(db, 'user_profiles', uid);
      await setDoc(
        docRef,
        {
          user_id: uid,
          height_cm: Number(profile.height_cm) || null,
          age: Number(profile.age) || null,
          gender: profile.gender,
          activity_level: profile.activity_level,
          goal: profile.goal,
          baseline_weight_kg: Number(profile.baseline_weight_kg) || null,
          updated_at: new Date().toISOString(),
        },
        { merge: true }
      );
      setSaveSuccess(true);
      showToast('Profile saved!', 'success');
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving profile:', err);
      showToast('Failed to save profile.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-zinc-500 text-sm">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6 pb-28">
      {/* Header Info */}
      <div>
        <h2 className="text-xl font-black text-white tracking-tight">Profile & Goals</h2>
        <p className="text-xs text-zinc-500 mt-0.5">
          Dynamic targets for Mifflin-St Jeor BMR, TDEE, & 2.2g/kg protein.
        </p>
      </div>

      {/* Target Preview Cards */}
      {targets.hasCompleteProfile ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {/* Daily Calories Target */}
            <div className="bg-surface-2 rounded-2xl p-4 border border-surface-3">
              <p className="text-zinc-500 text-[10px] font-semibold uppercase tracking-wider mb-1">
                Daily Calorie Target
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-amber-400 tabular-nums">
                  {targets.targetCalories}
                </span>
                <span className="text-xs text-zinc-500 font-medium">kcal</span>
              </div>
              <p className="text-[10px] text-zinc-400 mt-1">
                TDEE {targets.tdee} kcal • {targets.goalBadge}
              </p>
            </div>

            {/* Daily Protein Target */}
            <div className="bg-surface-2 rounded-2xl p-4 border border-surface-3">
              <p className="text-zinc-500 text-[10px] font-semibold uppercase tracking-wider mb-1">
                Daily Protein Target
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-emerald-400 tabular-nums">
                  {targets.targetProtein}
                </span>
                <span className="text-xs text-zinc-500 font-medium">g/d</span>
              </div>
              <p className="text-[10px] text-zinc-400 mt-1">
                2.2g / kg for strength recovery
              </p>
            </div>
          </div>

          {/* BMI & BMR Pill Row */}
          <div className="bg-surface-2 rounded-xl px-4 py-3 border border-surface-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-zinc-500">BMI:</span>
              <span className="font-bold text-white tabular-nums">{targets.bmi}</span>
              <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 text-[11px]">
                {targets.bmiCategory}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-zinc-500">BMR:</span>
              <span className="font-bold text-white tabular-nums">{targets.bmr} kcal</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-amber-950/20 border border-amber-800/30 rounded-2xl p-4 text-xs text-amber-300">
          Complete your physical profile below to unlock personalized daily calorie and protein targets.
        </div>
      )}

      {/* Profile Form */}
      <form onSubmit={handleSubmit} className="bg-surface-2 rounded-2xl p-5 border border-surface-3 space-y-4">
        {/* Height & Age Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-zinc-400 text-xs font-medium mb-1.5" htmlFor="profile-height">
              Height (cm)
            </label>
            <input
              id="profile-height"
              type="number"
              min="100"
              max="250"
              required
              placeholder="e.g. 178"
              value={profile.height_cm}
              onChange={(e) => setProfile({ ...profile, height_cm: e.target.value })}
              className="w-full bg-surface-3 text-white placeholder-zinc-600 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-1 focus:ring-zinc-600 border border-zinc-700/50 tabular-nums"
            />
          </div>

          <div>
            <label className="block text-zinc-400 text-xs font-medium mb-1.5" htmlFor="profile-age">
              Age (years)
            </label>
            <input
              id="profile-age"
              type="number"
              min="14"
              max="120"
              required
              placeholder="e.g. 28"
              value={profile.age}
              onChange={(e) => setProfile({ ...profile, age: e.target.value })}
              className="w-full bg-surface-3 text-white placeholder-zinc-600 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-1 focus:ring-zinc-600 border border-zinc-700/50 tabular-nums"
            />
          </div>
        </div>

        {/* Baseline Weight (if no weigh-in logged yet) */}
        <div>
          <label className="block text-zinc-400 text-xs font-medium mb-1.5" htmlFor="profile-weight">
            Current / Baseline Weight (kg)
          </label>
          <input
            id="profile-weight"
            type="number"
            step="0.1"
            min="30"
            max="300"
            required
            placeholder="e.g. 75.0"
            value={profile.baseline_weight_kg}
            onChange={(e) => setProfile({ ...profile, baseline_weight_kg: e.target.value })}
            className="w-full bg-surface-3 text-white placeholder-zinc-600 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-1 focus:ring-zinc-600 border border-zinc-700/50 tabular-nums"
          />
          {latestWeightKg && (
            <p className="text-[11px] text-zinc-500 mt-1">
              Latest recorded weight: <span className="text-purple-400 font-semibold">{latestWeightKg} kg</span>
            </p>
          )}
        </div>

        {/* Gender Toggle */}
        <div>
          <label className="block text-zinc-400 text-xs font-medium mb-1.5">Gender (for BMR)</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              id="gender-m-btn"
              onClick={() => setProfile({ ...profile, gender: 'M' })}
              className={`py-2.5 rounded-xl text-xs font-semibold transition-all border ${
                profile.gender === 'M'
                  ? 'bg-white text-black border-white shadow-sm'
                  : 'bg-surface-3 text-zinc-400 border-zinc-700/50 hover:text-white'
              }`}
            >
              Male
            </button>
            <button
              type="button"
              id="gender-f-btn"
              onClick={() => setProfile({ ...profile, gender: 'F' })}
              className={`py-2.5 rounded-xl text-xs font-semibold transition-all border ${
                profile.gender === 'F'
                  ? 'bg-white text-black border-white shadow-sm'
                  : 'bg-surface-3 text-zinc-400 border-zinc-700/50 hover:text-white'
              }`}
            >
              Female
            </button>
          </div>
        </div>

        {/* Activity Level */}
        <div>
          <label className="block text-zinc-400 text-xs font-medium mb-1.5" htmlFor="profile-activity">
            Activity Level
          </label>
          <select
            id="profile-activity"
            value={profile.activity_level}
            onChange={(e) => setProfile({ ...profile, activity_level: e.target.value })}
            className="w-full bg-surface-3 text-white rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-1 focus:ring-zinc-600 border border-zinc-700/50"
          >
            {Object.entries(ACTIVITY_MODIFIERS).map(([key, config]) => (
              <option key={key} value={key} className="bg-surface-2 text-white">
                {config.label} ({config.multiplier}x)
              </option>
            ))}
          </select>
        </div>

        {/* Goal */}
        <div>
          <label className="block text-zinc-400 text-xs font-medium mb-1.5" htmlFor="profile-goal">
            Primary Goal
          </label>
          <select
            id="profile-goal"
            value={profile.goal}
            onChange={(e) => setProfile({ ...profile, goal: e.target.value })}
            className="w-full bg-surface-3 text-white rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-1 focus:ring-zinc-600 border border-zinc-700/50"
          >
            {Object.entries(GOAL_MODIFIERS).map(([key, config]) => (
              <option key={key} value={key} className="bg-surface-2 text-white">
                {config.label}
              </option>
            ))}
          </select>
        </div>

        {/* Submit Button */}
        <button
          id="save-profile-btn"
          type="submit"
          disabled={isSaving}
          className="w-full bg-white text-black font-semibold rounded-xl py-3 text-sm active:scale-[0.98] transition-transform disabled:opacity-40 mt-2"
        >
          {isSaving ? 'Calculating & Saving...' : 'Save Profile & Update Targets'}
        </button>

        {saveSuccess && (
          <p className="text-emerald-400 text-xs text-center font-medium">
            ✓ Profile saved! Daily targets updated across your HUD.
          </p>
        )}
      </form>
    </div>
  );
}
