import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

function ScaleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-purple-400">
      <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v3.25H8a.75.75 0 000 1.5h3.25V18a.75.75 0 001.5 0v-7.25H16a.75.75 0 000-1.5h-3.25V6z" clipRule="evenodd" />
    </svg>
  );
}

export default function WeightTracker({ selectedDate }) {
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
    const numericWeight = parseFloat(weightKg);

    if (!uid || !selectedDate || isNaN(numericWeight) || numericWeight <= 0) {
      alert('Please enter a valid weight in kg.');
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
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving weight:', err);
      alert('Failed to save morning weight.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex items-center justify-between bg-surface-2 rounded-2xl p-4 mt-3 border border-surface-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-950/40 border border-purple-800/30 flex items-center justify-center">
          <ScaleIcon />
        </div>
        <div>
          <p className="text-zinc-500 text-[11px] font-medium uppercase tracking-wider">Morning Weight</p>
          {currentSavedWeight !== null && !isEditing ? (
            <p className="text-xl font-bold text-white tabular-nums leading-tight">
              {currentSavedWeight}{' '}
              <span className="text-xs font-normal text-zinc-500">kg</span>
            </p>
          ) : (
            <p className="text-xs text-zinc-400 mt-0.5">
              {isEditing ? 'Update your weight' : 'Not recorded yet'}
            </p>
          )}
        </div>
      </div>

      {currentSavedWeight !== null && !isEditing ? (
        <button
          id="edit-weight-btn"
          onClick={() => setIsEditing(true)}
          className="text-purple-400 hover:text-purple-300 text-xs font-medium px-3 py-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 active:scale-95 transition-all"
        >
          Edit
        </button>
      ) : (
        <form onSubmit={handleSaveWeight} className="flex items-center gap-2">
          <input
            id="weight-input"
            type="number"
            step="0.1"
            min="20"
            max="300"
            placeholder="e.g. 74.5"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            className="w-20 bg-surface-3 text-white text-xs rounded-xl px-2.5 py-2 outline-none focus:ring-1 focus:ring-purple-500 border border-zinc-700/50 tabular-nums"
          />
          <button
            id="save-weight-btn"
            type="submit"
            disabled={isSaving || !weightKg}
            className="flex items-center gap-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 active:scale-95 border border-purple-500/40 px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all disabled:opacity-40"
          >
            <span>{isSaving ? '...' : 'Save'}</span>
          </button>
        </form>
      )}
    </div>
  );
}
