import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { linkWithPopup, unlink } from 'firebase/auth';
import { auth, db, googleProvider } from '../firebase';
import { calculateNutritionTargets } from '../utils/nutritionMath';
import { exportAllDataAsCsv } from '../utils/exportCsv';
import { useToast } from './Toast';

function GoogleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24">
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

export default function Profile({ latestWeightKg }) {
  const { showToast, showConfirm } = useToast();
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
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState(null);
  const [isLinkingGoogle, setIsLinkingGoogle] = useState(false);
  const [providerData, setProviderData] = useState(auth.currentUser?.providerData || []);

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

  // Keep form weight in sync with latest recorded weight if available
  useEffect(() => {
    if (latestWeightKg !== undefined && latestWeightKg !== null && String(latestWeightKg) !== '') {
      setFormData((prev) => ({
        ...prev,
        current_weight_kg: String(latestWeightKg),
      }));
    }
  }, [latestWeightKg]);

  const targets = calculateNutritionTargets(formData, latestWeightKg);

  const googleProviderInfo = providerData.find((p) => p.providerId === 'google.com');
  const isGoogleLinked = !!googleProviderInfo;
  const hasMultipleProviders = providerData.length > 1;

  const handleLinkGoogle = async () => {
    if (!auth.currentUser) return;
    setIsLinkingGoogle(true);
    try {
      const result = await linkWithPopup(auth.currentUser, googleProvider);
      setProviderData([...(result.user?.providerData || [])]);
      showToast('Google account connected successfully!', 'success');
    } catch (err) {
      console.error('[Firebase Link Google Error]:', {
        code: err.code,
        message: err.message,
        error: err,
      });
      if (err.code !== 'auth/popup-closed-by-user') {
        const messages = {
          'auth/operation-not-allowed':
            'Google Sign-In is disabled in Firebase Console.',
          'auth/credential-already-in-use':
            'This Google account is already linked to another user account.',
          'auth/provider-already-linked':
            'Google account is already linked to your profile.',
          'auth/popup-blocked':
            'Popup was blocked by browser. Please allow popups for this site.',
          'auth/unauthorized-domain':
            'This domain is not authorized in Firebase Console.',
        };
        showToast(messages[err.code] || `Failed to connect Google: ${err.message}`, 'error');
      }
    } finally {
      setIsLinkingGoogle(false);
    }
  };

  const handleUnlinkGoogle = async () => {
    if (!auth.currentUser) return;
    if (!hasMultipleProviders) {
      showToast('Cannot disconnect your only sign-in method.', 'warning');
      return;
    }
    const confirmed = await showConfirm(
      'Disconnect Google Account',
      'Are you sure you want to disconnect your Google account? You will need to sign in with your email and password.',
      'Disconnect'
    );
    if (!confirmed) return;

    setIsLinkingGoogle(true);
    try {
      const user = await unlink(auth.currentUser, 'google.com');
      setProviderData([...(user?.providerData || [])]);
      showToast('Google account disconnected.', 'success');
    } catch (err) {
      console.error('[Firebase Unlink Google Error]:', err);
      showToast('Failed to disconnect Google account.', 'error');
    } finally {
      setIsLinkingGoogle(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const parsedHeight = Number(formData.height_cm) || null;
    const parsedAge = Number(formData.age) || null;
    const parsedWeight = Number(formData.current_weight_kg) || null;

    if (!parsedHeight || !parsedAge || !parsedWeight) {
      showToast('Please fill out all required physical details.', 'warning');
      return;
    }

    setIsSaving(true);
    try {
      const docRef = doc(db, 'user_profiles', uid);
      await setDoc(
        docRef,
        {
          user_id: uid,
          height_cm: parsedHeight,
          age: parsedAge,
          gender: formData.gender,
          activity_level: formData.activity_level,
          goal: formData.goal,
          current_weight_kg: parsedWeight,
          updated_at: new Date().toISOString(),
        },
        { merge: true }
      );

      // Automatically sync today's weight log if recorded
      if (parsedWeight) {
        const todayStr = new Date().toISOString().split('T')[0];
        const weightDocRef = doc(db, 'weight_logs', `${uid}_${todayStr}`);
        await setDoc(
          weightDocRef,
          {
            user_id: uid,
            date: todayStr,
            weight_kg: parsedWeight,
            updated_at: new Date().toISOString(),
          },
          { merge: true }
        );
      }

      setSaveSuccess(true);
      showToast('Profile saved! Dynamic targets applied.', 'success');
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving user profile:', err);
      showToast('Failed to save profile. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-[#707070] text-sm font-mono">
        Loading profile & targets...
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 pb-28">
      {/* Title */}
      <div className="pb-2 border-b border-white/[0.06]">
        <h2 className="text-xl sm:text-2xl font-black text-[#f3f4f6] tracking-tight">Profile & Goals</h2>
        <p className="text-xs sm:text-sm text-[#9ca3af] mt-1">
          Calculate BMI, TDEE, and customized daily macro targets dynamically.
        </p>
      </div>

      {/* 2-Column Responsive Layout on Desktop / 1-Column on Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        
        {/* Left Column: Form Controls (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Profile Form Card */}
          <form
            onSubmit={handleSubmit}
            className="bg-[#121316] rounded-2xl p-5 sm:p-6 border border-white/[0.08] shadow-[0_4px_16px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.03)] space-y-6"
            noValidate
          >
            {/* Fieldset 1: Biometrics */}
            <fieldset className="space-y-4">
              <legend className="text-xs font-bold text-[#f3f4f6] uppercase tracking-wider font-mono flex items-center gap-2 pb-1.5 border-b border-white/[0.07] w-full">
                <span>Biometrics & Body Stats</span>
              </legend>

              {/* Height & Age Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label
                    className="text-[#9ca3af] text-xs font-semibold flex items-center justify-between"
                    htmlFor="profile-height"
                  >
                    <span>Height (cm)</span>
                    <span className="text-[10px] text-[#6b7280] font-normal">100 - 250 cm</span>
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
                    className="w-full bg-[#1a1c22] text-[#f3f4f6] placeholder-[#6b7280] rounded-xl px-3.5 py-2.5 text-sm outline-none border border-white/[0.08] focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40 transition-all font-stat-mono"
                  />
                  <span className="text-[11px] text-[#6b7280]">Used for Mifflin-St Jeor BMR calculation</span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    className="text-[#9ca3af] text-xs font-semibold flex items-center justify-between"
                    htmlFor="profile-age"
                  >
                    <span>Age (years)</span>
                    <span className="text-[10px] text-[#6b7280] font-normal">14 - 120 yrs</span>
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
                    className="w-full bg-[#1a1c22] text-[#f3f4f6] placeholder-[#6b7280] rounded-xl px-3.5 py-2.5 text-sm outline-none border border-white/[0.08] focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40 transition-all font-stat-mono"
                  />
                  <span className="text-[11px] text-[#6b7280]">Caloric expenditure baseline</span>
                </div>
              </div>

              {/* Current Weight */}
              <div className="flex flex-col gap-1.5">
                <label
                  className="text-[#9ca3af] text-xs font-semibold flex items-center justify-between"
                  htmlFor="profile-weight"
                >
                  <span>Current Weight (kg)</span>
                  <span className="text-[10px] text-[#6b7280] font-normal">30 - 300 kg</span>
                </label>
                <input
                  id="profile-weight"
                  type="number"
                  step="0.01"
                  min="30"
                  max="300"
                  required
                  placeholder="e.g. 75.00"
                  value={formData.current_weight_kg}
                  onChange={(e) => setFormData({ ...formData, current_weight_kg: e.target.value })}
                  className="w-full bg-[#1a1c22] text-[#f3f4f6] placeholder-[#6b7280] rounded-xl px-3.5 py-2.5 text-sm outline-none border border-white/[0.08] focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40 transition-all font-stat-mono"
                />
                <span className="text-[11px] text-[#6b7280]">Syncs automatically with today's body weight log</span>
              </div>

              {/* Gender Selector */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[#9ca3af] text-xs font-semibold">Biological Sex (for BMR)</span>
                <div className="grid grid-cols-2 gap-2.5" role="radiogroup" aria-label="Gender selection">
                  <button
                    type="button"
                    id="gender-m-btn"
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
                    id="gender-f-btn"
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

            {/* Fieldset 2: Goals & Activity */}
            <fieldset className="space-y-4">
              <legend className="text-xs font-bold text-[#f3f4f6] uppercase tracking-wider font-mono flex items-center gap-2 pb-1.5 border-b border-white/[0.07] w-full">
                <span>Activity & Nutrition Targets</span>
              </legend>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Activity Level */}
                <div className="flex flex-col gap-1.5">
                  <label
                    className="text-[#9ca3af] text-xs font-semibold"
                    htmlFor="profile-activity"
                  >
                    Activity Level
                  </label>
                  <select
                    id="profile-activity"
                    value={formData.activity_level}
                    onChange={(e) => setFormData({ ...formData, activity_level: e.target.value })}
                    className="w-full bg-[#1a1c22] text-[#f3f4f6] rounded-xl px-3.5 py-2.5 text-sm outline-none border border-white/[0.08] focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40 transition-all cursor-pointer font-sans"
                  >
                    <option value="sedentary" className="bg-[#121316] text-[#f3f4f6]">Sedentary (1.2x TDEE)</option>
                    <option value="light" className="bg-[#121316] text-[#f3f4f6]">Light Activity (1.375x TDEE)</option>
                    <option value="moderate" className="bg-[#121316] text-[#f3f4f6]">Moderate Activity (1.55x TDEE)</option>
                    <option value="heavy" className="bg-[#121316] text-[#f3f4f6]">Heavy Training (1.725x TDEE)</option>
                  </select>
                  <span className="text-[11px] text-[#6b7280]">Calculates Total Daily Energy Expenditure</span>
                </div>

                {/* Primary Goal */}
                <div className="flex flex-col gap-1.5">
                  <label
                    className="text-[#9ca3af] text-xs font-semibold"
                    htmlFor="profile-goal"
                  >
                    Primary Goal
                  </label>
                  <select
                    id="profile-goal"
                    value={formData.goal}
                    onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                    className="w-full bg-[#1a1c22] text-[#f3f4f6] rounded-xl px-3.5 py-2.5 text-sm outline-none border border-white/[0.08] focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40 transition-all cursor-pointer font-sans"
                  >
                    <option value="lose" className="bg-[#121316] text-[#f3f4f6]">Lose Fat (-300 kcal deficit)</option>
                    <option value="maintain" className="bg-[#121316] text-[#f3f4f6]">Maintain Weight (Balanced TDEE)</option>
                    <option value="gain" className="bg-[#121316] text-[#f3f4f6]">Gain Muscle (+300 kcal surplus)</option>
                  </select>
                  <span className="text-[11px] text-[#6b7280]">Caloric adjustment to hit target weight</span>
                </div>
              </div>
            </fieldset>

            {/* Submit Action Area */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/[0.07]">
              <div className="text-[11px] text-[#6b7280] order-2 sm:order-1 text-center sm:text-left">
                Updates dynamic targets across all charts & dashboard cards
              </div>
              <button
                id="save-profile-btn"
                type="submit"
                disabled={isSaving}
                className="w-full sm:w-auto px-6 bg-[#22c55e] hover:bg-emerald-400 text-[#090a0c] font-bold rounded-xl py-2.5 text-sm active:scale-[0.98] transition-all disabled:opacity-40 shadow-[0_0_12px_rgba(34,197,94,0.3)] flex items-center justify-center gap-2 order-1 sm:order-2"
              >
                {isSaving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>Saving Profile...</span>
                  </>
                ) : (
                  <span>Save Profile & Update Targets</span>
                )}
              </button>
            </div>

            {saveSuccess && (
              <p className="text-[#22c55e] text-xs text-center font-bold font-mono">
                ✓ Profile saved! Dynamic targets applied across your HUD.
              </p>
            )}
          </form>
        </div>

        {/* Right Column: Dynamic Targets Preview & Account Sync (5 cols on lg, sticky) */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
          {/* Target Preview Breakdown */}
          {targets.hasProfile ? (
            <div className="bg-[#121316] rounded-2xl p-5 border border-white/[0.08] shadow-[0_4px_16px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.03)] space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.07]">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#9ca3af]">
                  Active Macro Blueprint
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/30">
                  CALCULATED
                </span>
              </div>

              {/* Main Numbers: Calories & Protein */}
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

              {/* Secondary Target Pills: Fat, Carbs, Fiber & BMI */}
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
            </div>
          ) : (
            <div className="bg-amber-950/30 border border-amber-800/40 rounded-2xl p-4 text-xs text-[#facc15] font-medium leading-relaxed">
              Set up your physical profile to unlock personalized daily calorie and protein targets tailored to your muscle-building or fat loss goals.
            </div>
          )}

          {/* Connected Accounts Section */}
          <div className="bg-[#121316] rounded-2xl p-5 border border-white/[0.08] shadow-[0_4px_16px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.03)] space-y-3">
            <div>
              <h3 className="text-[#f3f4f6] text-sm font-bold">Connected Accounts</h3>
              <p className="text-[#9ca3af] text-xs mt-0.5">
                Link your Google account for quick 1-tap sign in.
              </p>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-[#1a1c22] rounded-xl border border-white/[0.07] gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-lg bg-[#121316] flex items-center justify-center border border-white/[0.07] flex-shrink-0 shadow-sm">
                  <GoogleIcon />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[#f3f4f6] text-xs font-bold">Google</div>
                  <div
                    className="text-[#9ca3af] text-[11px] truncate"
                    title={isGoogleLinked ? googleProviderInfo?.email : undefined}
                  >
                    {isGoogleLinked
                      ? googleProviderInfo.email || 'Connected'
                      : 'Not connected'}
                  </div>
                </div>
              </div>

              {isGoogleLinked ? (
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="text-[#22c55e] text-xs font-semibold bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-800/40 whitespace-nowrap">
                    Connected
                  </span>
                  {hasMultipleProviders && (
                    <button
                      type="button"
                      id="unlink-google-btn"
                      disabled={isLinkingGoogle}
                      onClick={handleUnlinkGoogle}
                      className="text-[#9ca3af] hover:text-rose-400 text-xs font-medium px-2 py-1 transition-colors whitespace-nowrap"
                    >
                      Disconnect
                    </button>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  id="link-google-btn"
                  disabled={isLinkingGoogle}
                  onClick={handleLinkGoogle}
                  className="bg-[#f3f4f6] hover:bg-white text-[#090a0c] font-bold text-xs rounded-xl px-3.5 py-2 active:scale-95 transition-all disabled:opacity-40 flex-shrink-0 whitespace-nowrap shadow-sm"
                >
                  {isLinkingGoogle ? 'Connecting...' : 'Connect'}
                </button>
              )}
            </div>
          </div>

          {/* Data Export Section */}
          <div className="bg-[#121316] rounded-2xl p-5 border border-white/[0.08] shadow-[0_4px_16px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.03)] space-y-3">
            <div>
              <h3 className="text-[#f3f4f6] text-sm font-bold">Export Your Data</h3>
              <p className="text-[#9ca3af] text-xs mt-0.5">
                Download all your meal logs and weight logs as a CSV file.
              </p>
            </div>
            <button
              id="export-csv-btn"
              type="button"
              disabled={isExporting}
              onClick={async () => {
                setIsExporting(true);
                setExportResult(null);
                try {
                  const result = await exportAllDataAsCsv();
                  setExportResult(result);
                  showToast(`Exported ${result.mealCount} meals + ${result.weightCount} weight records!`, 'success');
                  setTimeout(() => setExportResult(null), 5000);
                } catch (err) {
                  console.error('Export error:', err);
                  showToast('Failed to export data. Please try again.', 'error');
                } finally {
                  setIsExporting(false);
                }
              }}
              className="w-full bg-[#1a1c22] hover:bg-[#20232a] text-[#f3f4f6] font-bold rounded-xl py-3 text-sm active:scale-[0.98] transition-all disabled:opacity-40 border border-white/[0.08] hover:border-white/[0.16] flex items-center justify-center gap-2 shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path d="M10.75 2.75a.75.75 0 00-1.06 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
                <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
              </svg>
              {isExporting ? 'Exporting...' : 'Export All Data (CSV)'}
            </button>
            {exportResult && (
              <p className="text-[#22c55e] text-xs text-center font-bold font-mono">
                ✓ Exported {exportResult.mealCount} meals + {exportResult.weightCount} weight entries → {exportResult.filename}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
