import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { calculateNutritionTargets } from '../utils/nutritionMath';

export default function Profile({ latestWeightKg }) {
  const [formData, setFormData] = useState({
    height_cm: '',
    age: '',
    gender: 'M',
    activity_level: 'moderate',
    goal: 'maintain',
    current_weight_kg: '',
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
          setFormData({
            height_cm: data.height_cm ? String(data.height_cm) : '',
            age: data.age ? String(data.age) : '',
            gender: data.gender || 'M',
            activity_level: data.activity_level || 'moderate',
            goal: data.goal || 'maintain',
            current_weight_kg: data.current_weight_kg || data.baseline_weight_kg
              ? String(data.current_weight_kg || data.baseline_weight_kg)
              : '',
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

  const targets = calculateNutritionTargets(formData, latestWeightKg);

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
          height_cm: Number(formData.height_cm) || null,
          age: Number(formData.age) || null,
          gender: formData.gender,
          activity_level: formData.activity_level,
          goal: formData.goal,
          current_weight_kg: Number(formData.current_weight_kg) || null,
          baseline_weight_kg: Number(formData.current_weight_kg) || null,
          updated_at: new Date().toISOString(),
        },
        { merge: true }
      );
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving user profile:', err);
      alert('Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-zinc-500 text-sm">
        Loading profile & targets...
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 pb-28">
      {/* Title */}
      <div>
        <h2 className="text-xl font-black text-white tracking-tight">Profile & Goals</h2>
        <p className="text-xs text-zinc-500 mt-0.5">
          Calculate BMI, TDEE, and customized daily macro targets.
        </p>
      </div>

      {/* Target Preview Breakdown */}
      {targets.hasProfile ? (
        <div className="space-y-3">
          {/* Main Numbers: Calories & Protein */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-surface-2 rounded-2xl p-4 border border-surface-3">
              <p className="text-zinc-500 text-[10px] font-semibold uppercase tracking-wider mb-1">
                Target Calories
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-amber-400 tabular-nums">
                  {targets.targetCalories}
                </span>
                <span className="text-xs text-zinc-500 font-medium">kcal</span>
              </div>
              <p className="text-[10px] text-zinc-500 mt-1">
                TDEE: {targets.tdee} kcal • {formData.goal.toUpperCase()}
              </p>
            </div>

            <div className="bg-surface-2 rounded-2xl p-4 border border-surface-3">
              <p className="text-zinc-500 text-[10px] font-semibold uppercase tracking-wider mb-1">
                Target Protein
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-emerald-400 tabular-nums">
                  {targets.targetMacros.protein_g}
                </span>
                <span className="text-xs text-zinc-500 font-medium">g/d</span>
              </div>
              <p className="text-[10px] text-zinc-500 mt-1">2.2g per kg bodyweight</p>
            </div>
          </div>

          {/* Secondary Target Pills: Fat, Carbs, Fiber & BMI */}
          <div className="bg-surface-2 rounded-xl p-3 border border-surface-3 flex items-center justify-between text-xs flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <span className="text-sky-400 font-medium">{targets.targetMacros.carbs_g}g carbs</span>
              <span className="text-rose-400 font-medium">{targets.targetMacros.fat_g}g fat (25%)</span>
              <span className="text-lime-400 font-medium">{targets.targetMacros.fiber_g}g fiber</span>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-400">
              <span>BMI:</span>
              <span className="text-white font-bold tabular-nums">{targets.bmi}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-amber-950/20 border border-amber-800/30 rounded-2xl p-4 text-xs text-amber-300">
          Set up your physical profile below to unlock personalized daily calorie and protein targets.
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="bg-surface-2 rounded-2xl p-5 border border-surface-3 space-y-4">
        {/* Height & Age */}
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
              value={formData.height_cm}
              onChange={(e) => setFormData({ ...formData, height_cm: e.target.value })}
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
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              className="w-full bg-surface-3 text-white placeholder-zinc-600 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-1 focus:ring-zinc-600 border border-zinc-700/50 tabular-nums"
            />
          </div>
        </div>

        {/* Current Weight */}
        <div>
          <label className="block text-zinc-400 text-xs font-medium mb-1.5" htmlFor="profile-weight">
            Current Weight (kg)
          </label>
          <input
            id="profile-weight"
            type="number"
            step="0.1"
            min="30"
            max="300"
            required
            placeholder="e.g. 75.0"
            value={formData.current_weight_kg}
            onChange={(e) => setFormData({ ...formData, current_weight_kg: e.target.value })}
            className="w-full bg-surface-3 text-white placeholder-zinc-600 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-1 focus:ring-zinc-600 border border-zinc-700/50 tabular-nums"
          />
          {latestWeightKg && (
            <p className="text-[11px] text-zinc-500 mt-1">
              Latest morning log: <span className="text-purple-400 font-semibold">{latestWeightKg} kg</span>
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
              onClick={() => setFormData({ ...formData, gender: 'M' })}
              className={`py-2.5 rounded-xl text-xs font-semibold transition-all border ${
                formData.gender === 'M'
                  ? 'bg-white text-black border-white shadow-sm'
                  : 'bg-surface-3 text-zinc-400 border-zinc-700/50 hover:text-white'
              }`}
            >
              Male
            </button>
            <button
              type="button"
              id="gender-f-btn"
              onClick={() => setFormData({ ...formData, gender: 'F' })}
              className={`py-2.5 rounded-xl text-xs font-semibold transition-all border ${
                formData.gender === 'F'
                  ? 'bg-white text-black border-white shadow-sm'
                  : 'bg-surface-3 text-zinc-400 border-zinc-700/50 hover:text-white'
              }`}
            >
              Female
            </button>
          </div>
        </div>

        {/* Activity Level Select */}
        <div>
          <label className="block text-zinc-400 text-xs font-medium mb-1.5" htmlFor="profile-activity">
            Activity Level
          </label>
          <select
            id="profile-activity"
            value={formData.activity_level}
            onChange={(e) => setFormData({ ...formData, activity_level: e.target.value })}
            className="w-full bg-surface-3 text-white rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-1 focus:ring-zinc-600 border border-zinc-700/50"
          >
            <option value="sedentary" className="bg-surface-2 text-white">
              Sedentary (1.2x — little or no exercise)
            </option>
            <option value="light" className="bg-surface-2 text-white">
              Light (1.375x — exercise 1-3 days/wk)
            </option>
            <option value="moderate" className="bg-surface-2 text-white">
              Moderate (1.55x — exercise 3-5 days/wk)
            </option>
            <option value="heavy" className="bg-surface-2 text-white">
              Heavy (1.725x — hard exercise 6-7 days/wk)
            </option>
          </select>
        </div>

        {/* Goal Select */}
        <div>
          <label className="block text-zinc-400 text-xs font-medium mb-1.5" htmlFor="profile-goal">
            Goal
          </label>
          <select
            id="profile-goal"
            value={formData.goal}
            onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
            className="w-full bg-surface-3 text-white rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-1 focus:ring-zinc-600 border border-zinc-700/50"
          >
            <option value="lose" className="bg-surface-2 text-white">
              Lose Fat (-300 kcal deficit)
            </option>
            <option value="maintain" className="bg-surface-2 text-white">
              Maintain Weight (0 kcal adjustment)
            </option>
            <option value="gain" className="bg-surface-2 text-white">
              Gain Muscle (+300 kcal surplus)
            </option>
          </select>
        </div>

        {/* Submit */}
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
            ✓ Profile saved! Dynamic targets applied across your HUD.
          </p>
        )}
      </form>
    </div>
  );
}
