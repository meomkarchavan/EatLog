import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, increment } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useToast } from './Toast';

function WaterDropIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-[#38bdf8]">
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
    <div className="flex items-center justify-between bg-[#121316] rounded-2xl p-3 sm:p-3.5 border border-white/[0.07] hover:border-white/[0.12] transition-all shadow-[0_2px_10px_rgba(0,0,0,0.45),inset_0_1px_0_0_rgba(255,255,255,0.03)] gap-2">
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        <div className="shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center shadow-[0_0_10px_rgba(56,189,248,0.2)]">
          <WaterDropIcon />
        </div>
        <div className="min-w-0">
          <p className="text-[#9ca3af] text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider">Water Intake</p>
          <p className="text-base sm:text-lg font-extrabold text-[#f3f4f6] font-stat-mono leading-tight truncate">
            {totalMl.toLocaleString()}{' '}
            <span className="text-xs font-normal text-[#6b7280]">ml ({formattedLiters} L)</span>
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
          className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 bg-[#1a1c22] hover:bg-[#252830] text-[#9ca3af] hover:text-[#f3f4f6] active:scale-90 border border-white/[0.08] rounded-xl text-base font-bold transition-all disabled:opacity-30 disabled:pointer-events-none shadow-sm"
        >
          −
        </button>

        <button
          id="add-water-btn"
          onClick={handleAddWater}
          disabled={isUpdating}
          className="flex items-center gap-1 bg-[#38bdf8]/15 hover:bg-[#38bdf8]/25 text-[#38bdf8] active:scale-95 border border-[#38bdf8]/40 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold font-stat-mono tracking-wide transition-all disabled:opacity-40 shadow-sm"
        >
          <span>+250ml</span>
        </button>
      </div>
    </div>
  );
}
