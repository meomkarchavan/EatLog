import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, increment } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useToast } from './Toast';

function WaterDropIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-cyan-400">
      <path fillRule="evenodd" d="M12.97 2.59a1.5 1.5 0 00-1.94 0C9.35 4.07 4.5 8.7 4.5 13.5a7.5 7.5 0 1015 0c0-4.8-4.85-9.43-6.53-10.91zM12 5.27c1.83 1.62 5.5 5.39 5.5 8.23a5.5 5.5 0 11-11 0c0-2.84 3.67-6.61 5.5-8.23z" clipRule="evenodd" />
    </svg>
  );
}

export default function WaterTracker({ selectedDate }) {
  const { showToast } = useToast();
  const [totalMl, setTotalMl] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid || !selectedDate) return;

    const docId = `${uid}_${selectedDate}`;
    const docRef = doc(db, 'water_logs', docId);

    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setTotalMl(docSnap.data().total_ml || 0);
        } else {
          setTotalMl(0);
        }
      },
      (error) => {
        console.error('Water listener error:', error);
      }
    );

    return unsubscribe;
  }, [selectedDate]);

  const handleAddWater = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid || !selectedDate || isUpdating) return;

    setIsUpdating(true);
    try {
      const docId = `${uid}_${selectedDate}`;
      const docRef = doc(db, 'water_logs', docId);

      await setDoc(
        docRef,
        {
          total_ml: increment(250),
          user_id: uid,
          date: selectedDate,
        },
        { merge: true }
      );
    } catch (err) {
      console.error('Error logging water:', err);
      showToast('Failed to log water intake.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSubtractWater = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid || !selectedDate || isUpdating || totalMl <= 0) return;

    setIsUpdating(true);
    try {
      const docId = `${uid}_${selectedDate}`;
      const docRef = doc(db, 'water_logs', docId);
      const amountToSubtract = totalMl < 250 ? -totalMl : -250;

      await setDoc(
        docRef,
        {
          total_ml: increment(amountToSubtract),
          user_id: uid,
          date: selectedDate,
        },
        { merge: true }
      );
    } catch (err) {
      console.error('Error subtracting water:', err);
      showToast('Failed to update water intake.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const formattedLiters = (totalMl / 1000).toFixed(2);

  return (
    <div className="flex items-center justify-between bg-surface-2 rounded-2xl p-3.5 sm:p-4 mt-2.5 sm:mt-3 border border-surface-3 gap-2">
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        <div className="shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-cyan-950/40 border border-cyan-800/30 flex items-center justify-center">
          <WaterDropIcon />
        </div>
        <div className="min-w-0">
          <p className="text-zinc-500 text-[10px] sm:text-[11px] font-medium uppercase tracking-wider">Water Intake</p>
          <p className="text-lg sm:text-xl font-bold text-white tabular-nums leading-tight truncate">
            {totalMl.toLocaleString()}{' '}
            <span className="text-xs font-normal text-zinc-500">ml ({formattedLiters} L)</span>
          </p>
        </div>
      </div>

      {/* Action Buttons: Minus & Plus */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <button
          id="subtract-water-btn"
          onClick={handleSubtractWater}
          disabled={isUpdating || totalMl <= 0}
          title="Subtract 250ml"
          className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 bg-surface-3 hover:bg-zinc-800 text-zinc-400 hover:text-white active:scale-95 border border-zinc-700/50 rounded-xl text-base font-bold transition-all disabled:opacity-30 disabled:pointer-events-none"
        >
          −
        </button>

        <button
          id="add-water-btn"
          onClick={handleAddWater}
          disabled={isUpdating}
          className="flex items-center gap-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 active:scale-95 border border-cyan-500/30 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all disabled:opacity-40"
        >
          <span>+250ml</span>
        </button>
      </div>
    </div>
  );
}
