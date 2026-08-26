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
      showToast(`Failed to disconnect: ${err.message}`, 'error');
    } finally {
      setIsLinkingGoogle(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const docRef = doc(db, 'user_profiles', uid);
      const rawWeight = Number(formData.current_weight_kg);
      const parsedWeight = !isNaN(rawWeight) && rawWeight > 0 ? Math.round(rawWeight * 100) / 100 : null;

      await setDoc(
        docRef,
        {
          user_id: uid,
          height_cm: Number(formData.height_cm) || null,
          age: Number(formData.age) || null,
          gender: formData.gender,
          activity_level: formData.activity_level,
          goal: formData.goal,
          current_weight_kg: parsedWeight,
          baseline_weight_kg: parsedWeight,
          updated_at: new Date().toISOString(),
        },
        { merge: true }
      );

      // Also sync today's weight log
      if (parsedWeight) {
        const todayStr = new Date().toLocaleDateString('en-CA');
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
      <div className="flex-1 flex items-center justify-center p-6 text-zinc-500 text-sm">
        Loading profile & targets...
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-3.5 sm:px-5 py-3 sm:py-4 space-y-4 sm:space-y-5 pb-28">
      {/* Title */}
      <div>
        <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">Profile & Goals</h2>
        <p className="text-xs text-zinc-500 mt-0.5">
          Calculate BMI, TDEE, and customized daily macro targets.
        </p>
      </div>

      {/* Target Preview Breakdown */}
      {targets.hasProfile ? (
        <div className="space-y-3">
          {/* Main Numbers: Calories & Protein */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            <div className="bg-surface-2 rounded-2xl p-3.5 sm:p-4 border border-surface-3">
              <p className="text-zinc-500 text-[10px] font-semibold uppercase tracking-wider mb-1">
                Target Calories
              </p>
              <div className="flex items-baseline gap-1 flex-wrap">
                <span className="text-2xl sm:text-3xl font-black text-amber-400 tabular-nums">
                  {targets.targetCalories}
                </span>
                <span className="text-xs text-zinc-500 font-medium">kcal</span>
              </div>
              <p className="text-[10px] text-zinc-500 mt-1 truncate">
                TDEE: {targets.tdee} kcal • {formData.goal.toUpperCase()}
              </p>
            </div>

            <div className="bg-surface-2 rounded-2xl p-3.5 sm:p-4 border border-surface-3">
              <p className="text-zinc-500 text-[10px] font-semibold uppercase tracking-wider mb-1">
                Target Protein
              </p>
              <div className="flex items-baseline gap-1 flex-wrap">
                <span className="text-2xl sm:text-3xl font-black text-emerald-400 tabular-nums">
                  {targets.targetMacros.protein_g}
                </span>
                <span className="text-xs text-zinc-500 font-medium">g/d</span>
              </div>
              <p className="text-[10px] text-zinc-500 mt-1 truncate">2.2g per kg bodyweight</p>
            </div>
          </div>

          {/* Secondary Target Pills: Fat, Carbs, Fiber & BMI */}
          <div className="bg-surface-2 rounded-xl p-3 border border-surface-3 flex items-center justify-between text-xs flex-wrap gap-2">
            <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
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
      <form onSubmit={handleSubmit} className="bg-surface-2 rounded-2xl p-4 sm:p-5 border border-surface-3 space-y-4">
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
            step="0.01"
            min="30"
            max="300"
            required
            placeholder="e.g. 75.00"
            value={formData.current_weight_kg}
            onChange={(e) => setFormData({ ...formData, current_weight_kg: e.target.value })}
            className="w-full bg-surface-3 text-white placeholder-zinc-600 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-1 focus:ring-zinc-600 border border-zinc-700/50 tabular-nums"
          />
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

        {/* Activity Level */}
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
            <option value="sedentary" className="bg-surface-2 text-white">Sedentary (1.2x)</option>
            <option value="light" className="bg-surface-2 text-white">Light (1.375x)</option>
            <option value="moderate" className="bg-surface-2 text-white">Moderate (1.55x)</option>
            <option value="heavy" className="bg-surface-2 text-white">Heavy (1.725x)</option>
          </select>
        </div>

        {/* Goal */}
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
            <option value="lose" className="bg-surface-2 text-white">Lose Fat (-300 kcal)</option>
            <option value="maintain" className="bg-surface-2 text-white">Maintain Weight</option>
            <option value="gain" className="bg-surface-2 text-white">Gain Muscle (+300 kcal)</option>
          </select>
        </div>

        {/* Submit */}
        <button
          id="save-profile-btn"
          type="submit"
          disabled={isSaving}
          className="w-full bg-white text-black font-semibold rounded-xl py-3 text-sm active:scale-[0.98] transition-transform disabled:opacity-40"
        >
          {isSaving ? 'Calculating & Saving...' : 'Save Profile & Update Targets'}
        </button>

        {saveSuccess && (
          <p className="text-emerald-400 text-xs text-center font-medium">
            ✓ Profile saved! Dynamic targets applied across your HUD.
          </p>
        )}
      </form>

      {/* Connected Accounts Section */}
      <div className="bg-surface-2 rounded-2xl p-5 border border-surface-3 space-y-4">
        <div>
          <h3 className="text-white text-sm font-bold">Connected Accounts</h3>
          <p className="text-zinc-500 text-xs mt-0.5">
            Link your Google account for quick 1-tap sign in.
          </p>
        </div>

        <div className="flex items-center justify-between p-3.5 bg-surface-3/50 rounded-xl border border-zinc-800 gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center border border-zinc-700/50 flex-shrink-0">
              <GoogleIcon />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-white text-xs font-semibold">Google</div>
              <div
                className="text-zinc-500 text-[11px] truncate"
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
              <span className="text-emerald-400 text-xs font-medium bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-800/40 whitespace-nowrap">
                Connected
              </span>
              {hasMultipleProviders && (
                <button
                  type="button"
                  id="unlink-google-btn"
                  disabled={isLinkingGoogle}
                  onClick={handleUnlinkGoogle}
                  className="text-zinc-400 hover:text-red-400 text-xs font-medium px-2 py-1 transition-colors whitespace-nowrap"
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
              className="bg-white hover:bg-zinc-200 text-black font-semibold text-xs rounded-lg px-3.5 py-2 active:scale-95 transition-all disabled:opacity-40 flex-shrink-0 whitespace-nowrap"
            >
              {isLinkingGoogle ? 'Connecting...' : 'Connect'}
            </button>
          )}
        </div>
      </div>

      {/* Data Export Section */}
      <div className="bg-surface-2 rounded-2xl p-5 border border-surface-3 space-y-3">
        <div>
          <h3 className="text-white text-sm font-bold">Export Your Data</h3>
          <p className="text-zinc-500 text-xs mt-0.5">
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
          className="w-full bg-surface-3 text-white font-semibold rounded-xl py-3 text-sm active:scale-[0.98] transition-all disabled:opacity-40 border border-zinc-700/50 hover:border-zinc-600 flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
            <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
          </svg>
          {isExporting ? 'Exporting...' : 'Export All Data (CSV)'}
        </button>
        {exportResult && (
          <p className="text-emerald-400 text-xs text-center font-medium">
            ✓ Exported {exportResult.mealCount} meals + {exportResult.weightCount} weight entries → {exportResult.filename}
          </p>
        )}
      </div>
    </div>
  );
}
