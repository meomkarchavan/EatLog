import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useToast } from './Toast';

function ScaleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-[#fb7185]">
      <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v3.25H8a.75.75 0 000 1.5h3.25V18a.75.75 0 001.5 0v-7.25H16a.75.75 0 000-1.5h-3.25V6z" clipRule="evenodd" />
    </svg>
  );
}

export default function WeightTracker({ selectedDate }) {
  const { showToast } = useToast();
  const [weightKg, setWeightKg] = useState('');
  const [currentSavedWeight, setCurrentSavedWeight] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid || !selectedDate) return;

    const docId = `${uid}_${selectedDate}`;
    const docRef = doc(db, 'weight_logs', docId);

    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const val = docSnap.data().weight_kg;
          setCurrentSavedWeight(val);
          setWeightKg(val !== undefined && val !== null ? String(val) : '');
          setIsEditing(false);
        } else {
          setCurrentSavedWeight(null);
          setWeightKg('');
          setIsEditing(false);
        }
      },
      (error) => {
        console.error('Weight listener error:', error);
      }
    );

    return unsubscribe;
  }, [selectedDate]);

  const handleSaveWeight = async (e) => {
    e?.preventDefault();
    const uid = auth.currentUser?.uid;
    const rawNumeric = parseFloat(weightKg);
    const numericWeight = !isNaN(rawNumeric) ? Math.round(rawNumeric * 100) / 100 : NaN;

    if (!uid || !selectedDate || isNaN(numericWeight) || numericWeight <= 0) {
      showToast('Please enter a valid weight in kg.', 'warning');
      return;
    }

    setIsSaving(true);
    try {
      const docId = `${uid}_${selectedDate}`;
      const docRef = doc(db, 'weight_logs', docId);

      await setDoc(
        docRef,
        {
          user_id: uid,
          date: selectedDate,
          weight_kg: numericWeight,
          updated_at: new Date().toISOString(),
        },
        { merge: true }
      );

      // Keep user_profiles current_weight_kg in sync so macro targets and profile stay updated
      const profileRef = doc(db, 'user_profiles', uid);
      await setDoc(
        profileRef,
        {
          current_weight_kg: numericWeight,
          updated_at: new Date().toISOString(),
        },
        { merge: true }
      );

      setIsEditing(false);
      showToast('Weight recorded & profile updated!', 'success');
    } catch (err) {
      console.error('Error saving weight:', err);
      showToast('Failed to save weight.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex items-center justify-between bg-[#121316] rounded-2xl p-3 sm:p-3.5 border border-white/[0.07] hover:border-white/[0.12] transition-all shadow-[0_2px_10px_rgba(0,0,0,0.45),inset_0_1px_0_0_rgba(255,255,255,0.03)] gap-2">
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        <div className="shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-pink-500/15 border border-pink-500/30 flex items-center justify-center shadow-[0_0_10px_rgba(244,114,182,0.2)]">
          <ScaleIcon />
        </div>
        <div className="min-w-0">
          <p className="text-[#9ca3af] text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider">Weight</p>
          {currentSavedWeight !== null && !isEditing ? (
            <p className="text-base sm:text-lg font-extrabold text-[#f3f4f6] font-stat-mono leading-tight truncate">
              {currentSavedWeight}{' '}
              <span className="text-xs font-normal text-[#6b7280]">kg</span>
            </p>
          ) : (
            <p className="text-xs text-[#6b7280] mt-0.5 truncate font-mono">
              {isEditing ? 'Update weight' : 'Not recorded'}
            </p>
          )}
        </div>
      </div>

      {currentSavedWeight !== null && !isEditing ? (
        <button
          id="edit-weight-btn"
          onClick={() => setIsEditing(true)}
          className="shrink-0 text-[#f472b6] hover:text-pink-300 text-xs font-bold px-2.5 sm:px-3 py-1.5 rounded-xl border border-pink-500/30 bg-pink-500/10 active:scale-95 transition-all shadow-sm"
        >
          Edit
        </button>
      ) : (
        <form onSubmit={handleSaveWeight} className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <input
            id="weight-input"
            type="number"
            step="0.01"
            min="20"
            max="300"
            placeholder="e.g. 74.55"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            className="w-16 sm:w-20 bg-[#1a1c22] text-[#f3f4f6] text-xs rounded-xl px-2 sm:px-2.5 py-1.5 sm:py-2 outline-none focus:ring-2 focus:ring-pink-500/40 border border-white/[0.08] focus:border-pink-500/60 font-stat-mono"
          />
          <button
            id="save-weight-btn"
            type="submit"
            disabled={isSaving || !weightKg}
            className="flex items-center gap-1 bg-[#f472b6]/20 hover:bg-[#f472b6]/30 text-[#f472b6] active:scale-95 border border-[#f472b6]/40 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold font-mono tracking-wide transition-all disabled:opacity-40 shadow-sm"
          >
            <span>{isSaving ? '...' : 'Save'}</span>
          </button>
        </form>
      )}
    </div>
  );
}
