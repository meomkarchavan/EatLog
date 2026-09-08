import { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { Flame, Sparkles, ArrowRight, ShieldCheck, Target, Zap } from 'lucide-react';
import { auth, db } from '../firebase';
import { calculateNutritionTargets } from '../utils/nutritionMath';
import { useToast } from './Toast';

export default function OnboardingScreen({ onComplete, onSkip }) {
  const { showToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    height_cm: '175',
    age: '27',
    gender: 'M',
    activity_level: 'moderate',
    goal: 'maintain',
    current_weight_kg: '70',
  });

  // Calculate live targets as user fills in the form
  const targets = calculateNutritionTargets(formData, formData.current_weight_kg);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const uid = auth.currentUser?.uid;
    if (!uid) {
      showToast('Authentication error. Please sign in.', 'error');
      return;
    }

    const heightNum = Number(formData.height_cm);
    const ageNum = Number(formData.age);
    const weightNum = Number(formData.current_weight_kg);

    if (!heightNum || heightNum < 100 || heightNum > 250) {
      showToast('Please enter a valid height between 100 and 250 cm.', 'warning');
      return;
    }

    if (!ageNum || ageNum < 14 || ageNum > 120) {
      showToast('Please enter a valid age between 14 and 120.', 'warning');
      return;
    }

    if (!weightNum || weightNum < 30 || weightNum > 300) {
      showToast('Please enter a valid weight between 30 and 300 kg.', 'warning');
      return;
    }

    setIsSaving(true);
    try {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];

      // 1. Save user profile
      const profileRef = doc(db, 'user_profiles', uid);
      await setDoc(
        profileRef,
        {
          height_cm: heightNum,
          age: ageNum,
          gender: formData.gender,
          activity_level: formData.activity_level,
          goal: formData.goal,
          current_weight_kg: weightNum,
          baseline_weight_kg: weightNum,
          onboarding_completed: true,
          updated_at: now.toISOString(),
          created_at: now.toISOString(),
        },
        { merge: true }
      );

      // 2. Automatically log initial baseline weight for today
      const weightRef = doc(db, 'weight_logs', `${uid}_${todayStr}`);
      await setDoc(
        weightRef,
        {
          user_id: uid,
          date: todayStr,
          weight_kg: weightNum,
          updated_at: now.toISOString(),
        },
        { merge: true }
      );

      showToast('Profile configured! Welcome to EatLog.', 'success');
      if (onComplete) {
        onComplete();
      }
    } catch (err) {
      console.error('Failed to save profile during onboarding:', err);
      showToast('Failed to save profile. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090a0c] text-[#f3f4f6] flex flex-col justify-between selection:bg-[#22c55e]/20 selection:text-[#22c55e] relative overflow-x-hidden">
      {/* Ambient background glow layers */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-[#22c55e]/10 via-[#38bdf8]/5 to-transparent blur-[120px] rounded-full opacity-60" />
        <div className="absolute bottom-[10%] right-[-5%] w-[500px] h-[500px] bg-gradient-to-tr from-[#facc15]/5 to-transparent blur-[140px] rounded-full" />
      </div>

      {/* Top Header */}
      <header className="relative z-10 px-4 sm:px-6 lg:px-8 py-4 border-b border-white/[0.07] bg-[#090a0c]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#22c55e] to-emerald-400 p-[1px] shadow-[0_0_12px_rgba(34,197,94,0.3)]">
              <div className="w-full h-full bg-[#121316] rounded-[11px] flex items-center justify-center">
                <Flame className="w-4 h-4 text-[#22c55e]" />
              </div>
            </div>
            <span className="text-base sm:text-lg font-black tracking-tight text-[#f3f4f6]">EatLog</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-full bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/30 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              <span>Step 1 of 1 • Profile Setup</span>
            </span>
            {onSkip && (
              <button
                id="skip-onboarding-btn"
                type="button"
                onClick={onSkip}
                className="text-xs text-[#9ca3af] hover:text-[#f3f4f6] px-3 py-1 rounded-lg transition-colors hover:bg-white/[0.05]"
              >
                Skip
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Form Content */}
      <main className="relative z-10 flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Form Setup (7 cols on lg) */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#f3f4f6] tracking-tight">
                Profile & Goals
              </h1>
              <p className="text-xs sm:text-sm text-[#9ca3af] mt-1">
                Calculate BMI, TDEE, and customized daily macro targets dynamically.
              </p>
            </div>

            <form
              id="onboarding-form"
              onSubmit={handleSubmit}
              className="bg-[#121316] rounded-2xl p-5 sm:p-7 border border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.03)] space-y-6"
            >
              {/* Fieldset 1: Biometrics & Body Stats */}
              <fieldset className="space-y-4">
                <legend className="text-xs font-bold text-[#f3f4f6] uppercase tracking-wider font-mono flex items-center gap-2 pb-1.5 border-b border-white/[0.07] w-full">
                  <span>BIOMETRICS & BODY STATS</span>
                </legend>

                {/* Height & Age Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[#9ca3af] text-xs font-semibold" htmlFor="onboarding-height">
                        Height (cm)
                      </label>
                      <span className="text-[10px] text-[#6b7280] font-mono">100 - 250 cm</span>
                    </div>
                    <input
                      id="onboarding-height"
                      type="number"
                      min="100"
                      max="250"
                      placeholder="175"
                      value={formData.height_cm}
                      onChange={(e) => setFormData({ ...formData, height_cm: e.target.value })}
                      required
                      className="w-full bg-[#1a1c22] text-[#f3f4f6] placeholder-[#6b7280] rounded-xl px-3.5 py-2.5 text-sm outline-none border border-white/[0.08] focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40 transition-all font-stat-mono"
                    />
                    <span className="text-[11px] text-[#6b7280]">Used for Mifflin-St Jeor BMR calculation</span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[#9ca3af] text-xs font-semibold" htmlFor="onboarding-age">
                        Age (years)
                      </label>
                      <span className="text-[10px] text-[#6b7280] font-mono">14 - 120 yrs</span>
                    </div>
                    <input
                      id="onboarding-age"
                      type="number"
                      min="14"
                      max="120"
                      placeholder="27"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      required
                      className="w-full bg-[#1a1c22] text-[#f3f4f6] placeholder-[#6b7280] rounded-xl px-3.5 py-2.5 text-sm outline-none border border-white/[0.08] focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40 transition-all font-stat-mono"
                    />
                    <span className="text-[11px] text-[#6b7280]">Caloric expenditure baseline</span>
                  </div>
                </div>

                {/* Current Weight Input */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[#9ca3af] text-xs font-semibold" htmlFor="onboarding-weight">
                      Current Weight (kg)
                    </label>
                    <span className="text-[10px] text-[#6b7280] font-mono">30 - 300 kg</span>
                  </div>
                  <input
                    id="onboarding-weight"
                    type="number"
                    step="0.1"
                    min="30"
                    max="300"
                    placeholder="70"
                    value={formData.current_weight_kg}
                    onChange={(e) => setFormData({ ...formData, current_weight_kg: e.target.value })}
                    required
                    className="w-full bg-[#1a1c22] text-[#f3f4f6] placeholder-[#6b7280] rounded-xl px-3.5 py-2.5 text-sm outline-none border border-white/[0.08] focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40 transition-all font-stat-mono"
                  />
                  <span className="text-[11px] text-[#6b7280]">Syncs automatically with today's body weight log</span>
                </div>

                {/* Biological Sex Toggle */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[#9ca3af] text-xs font-semibold">Biological Sex (for BMR)</span>
                  <div className="grid grid-cols-2 gap-2.5" role="radiogroup" aria-label="Gender selection">
                    <button
                      type="button"
                      id="onboarding-gender-m"
                      role="radio"
                      aria-checked={formData.gender === 'M'}
                      onClick={() => setFormData({ ...formData, gender: 'M' })}
                      className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-2 active:scale-95 ${
                        formData.gender === 'M'
                          ? 'bg-[#f3f4f6] text-[#090a0c] border-white shadow-md'
                          : 'bg-[#1a1c22] text-[#9ca3af] border-white/[0.08] hover:text-[#f3f4f6] hover:border-white/[0.15]'
                      }`}
                    >
                      <span>Male</span>
                      <span className="text-[10px] opacity-70 font-mono">+5 kcal</span>
                    </button>
                    <button
                      type="button"
                      id="onboarding-gender-f"
                      role="radio"
                      aria-checked={formData.gender === 'F'}
                      onClick={() => setFormData({ ...formData, gender: 'F' })}
                      className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-2 active:scale-95 ${
                        formData.gender === 'F'
                          ? 'bg-[#f3f4f6] text-[#090a0c] border-white shadow-md'
                          : 'bg-[#1a1c22] text-[#9ca3af] border-white/[0.08] hover:text-[#f3f4f6] hover:border-white/[0.15]'
                      }`}
                    >
                      <span>Female</span>
                      <span className="text-[10px] opacity-70 font-mono">-161 kcal</span>
                    </button>
                  </div>
                </div>
              </fieldset>

              {/* Divider */}
              <div className="border-t border-white/[0.07]" />

              {/* Fieldset 2: Activity & Goals */}
              <fieldset className="space-y-4">
                <legend className="text-xs font-bold text-[#f3f4f6] uppercase tracking-wider font-mono flex items-center gap-2 pb-1.5 border-b border-white/[0.07] w-full">
                  <span>ACTIVITY & NUTRITION TARGETS</span>
                </legend>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Activity Level */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[#9ca3af] text-xs font-semibold" htmlFor="onboarding-activity">
                      Activity Level
                    </label>
                    <select
                      id="onboarding-activity"
                      value={formData.activity_level}
                      onChange={(e) => setFormData({ ...formData, activity_level: e.target.value })}
                      className="w-full bg-[#1a1c22] text-[#f3f4f6] rounded-xl px-3.5 py-2.5 text-sm outline-none border border-white/[0.08] focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40 transition-all cursor-pointer font-sans"
                    >
                      <option value="sedentary" className="bg-[#121316]">Sedentary (1.2x TDEE)</option>
                      <option value="light" className="bg-[#121316]">Light Activity (1.375x TDEE)</option>
                      <option value="moderate" className="bg-[#121316]">Moderate Activity (1.55x TDEE)</option>
                      <option value="heavy" className="bg-[#121316]">Heavy Training (1.725x TDEE)</option>
                    </select>
                    <span className="text-[11px] text-[#6b7280]">Calculates Total Daily Energy Expenditure</span>
                  </div>

                  {/* Primary Goal */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[#9ca3af] text-xs font-semibold" htmlFor="onboarding-goal">
                      Primary Goal
                    </label>
                    <select
                      id="onboarding-goal"
                      value={formData.goal}
                      onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                      className="w-full bg-[#1a1c22] text-[#f3f4f6] rounded-xl px-3.5 py-2.5 text-sm outline-none border border-white/[0.08] focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40 transition-all cursor-pointer font-sans"
                    >
                      <option value="lose" className="bg-[#121316]">Lose Fat (-300 kcal deficit)</option>
                      <option value="maintain" className="bg-[#121316]">Maintain Weight (Balanced TDEE)</option>
                      <option value="gain" className="bg-[#121316]">Gain Muscle (+300 kcal surplus)</option>
                    </select>
                    <span className="text-[11px] text-[#6b7280]">Caloric adjustment to hit target weight</span>
                  </div>
                </div>
              </fieldset>

              {/* Action Area */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/[0.07]">
                <div className="text-[11px] text-[#6b7280] order-2 sm:order-1 text-center sm:text-left">
                  Updates dynamic targets across all charts & dashboard cards
                </div>
                <button
                  id="save-profile-btn"
                  type="submit"
                  disabled={isSaving}
                  className="w-full sm:w-auto px-7 bg-[#22c55e] hover:bg-emerald-400 text-[#090a0c] font-extrabold rounded-xl py-3 text-sm active:scale-[0.98] transition-all disabled:opacity-40 shadow-[0_0_20px_rgba(34,197,94,0.35)] flex items-center justify-center gap-2 order-1 sm:order-2"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>Saving Profile...</span>
                    </>
                  ) : (
                    <>
                      <span>Save Profile & Update Targets</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Live Dynamic Target Blueprint (5 cols on lg) */}
          <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-24">
            <div className="bg-[#121316] rounded-2xl p-5 sm:p-6 border border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.03)] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.07]">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#22c55e] shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#9ca3af]">
                    Live Macro Blueprint
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/30">
                  REACTIVE
                </span>
              </div>

              {/* Main Calculated Calories & Protein */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#1a1c22] rounded-xl p-3.5 border border-white/[0.07] border-t-2 border-t-[#facc15]">
                  <p className="text-[#9ca3af] text-[10px] font-semibold uppercase tracking-wider mb-1">
                    Target Calories
                  </p>
                  <div className="flex items-baseline gap-1 flex-wrap">
                    <span className="text-2xl font-extrabold text-[#facc15] font-stat-mono leading-none tracking-tight">
                      {targets.targetCalories}
                    </span>
                    <span className="text-xs text-[#6b7280] font-stat-mono font-medium">kcal</span>
                  </div>
                  <p className="text-[10px] text-[#6b7280] mt-1 truncate font-mono">
                    TDEE: {targets.tdee} kcal • {formData.goal.toUpperCase()}
                  </p>
                </div>

                <div className="bg-[#1a1c22] rounded-xl p-3.5 border border-white/[0.07] border-t-2 border-t-[#22c55e]">
                  <p className="text-[#9ca3af] text-[10px] font-semibold uppercase tracking-wider mb-1">
                    Target Protein
                  </p>
                  <div className="flex items-baseline gap-1 flex-wrap">
                    <span className="text-2xl font-extrabold text-[#22c55e] font-stat-mono leading-none tracking-tight">
                      {targets.targetMacros.protein_g}
                    </span>
                    <span className="text-xs text-[#6b7280] font-stat-mono font-medium">g/d</span>
                  </div>
                  <p className="text-[10px] text-[#6b7280] mt-1 truncate font-mono">2.2g per kg bodyweight</p>
                </div>
              </div>

              {/* Secondary Target Badges */}
              <div className="bg-[#1a1c22] rounded-xl p-3 border border-white/[0.07] flex items-center justify-between text-xs flex-wrap gap-2 shadow-sm">
                <div className="flex items-center gap-2.5 flex-wrap font-stat-mono font-semibold">
                  <span className="text-[#38bdf8]">{targets.targetMacros.carbs_g}g carbs</span>
                  <span className="text-[#fb923c]">{targets.targetMacros.fat_g}g fat (25%)</span>
                  <span className="text-[#a78bfa]">{targets.targetMacros.fiber_g}g fiber</span>
                </div>
                <div className="flex items-center gap-1.5 text-[#9ca3af]">
                  <span>BMI:</span>
                  <span className="text-[#f3f4f6] font-bold font-stat-mono">{targets.bmi}</span>
                </div>
              </div>

              <div className="p-3.5 bg-[#1a1c22]/60 rounded-xl border border-white/[0.05] text-xs text-[#9ca3af] leading-relaxed space-y-2">
                <div className="flex items-center gap-1.5 text-[#22c55e] font-bold text-[11px] font-mono uppercase">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#22c55e]" />
                  <span>Mifflin-St Jeor + Katch-McArdle Formula</span>
                </div>
                <p>
                  These numbers are calculated dynamically to fuel muscle recovery and optimal energy output. You can fine-tune them anytime in the Goals tab.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-4 px-4 sm:px-6 lg:px-8 border-t border-white/[0.07] bg-[#090a0c]/80 text-center text-xs text-[#6b7280] font-mono">
        EatLog Nutrition Architecture • Hypertrophy & Strength Target Engine
      </footer>
    </div>
  );
}
