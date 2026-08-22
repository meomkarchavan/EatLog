import { useState } from 'react';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useToast } from './Toast';

export default function MealCard({ log, onPinStaple, isPinned }) {
  const { showToast, showConfirm } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isReEstimating, setIsReEstimating] = useState(false);

  const [editForm, setEditForm] = useState({
    food_summary: log.food_summary || '',
    calories: log.calories ?? 0,
    protein_g: log.protein_g ?? 0,
    carbs_g: log.carbs_g ?? 0,
    fat_g: log.fat_g ?? 0,
    fiber_g: log.fiber_g ?? 0,
  });

  const handleStartEdit = () => {
    setEditForm({
      food_summary: log.food_summary || '',
      calories: log.calories ?? 0,
      protein_g: log.protein_g ?? 0,
      carbs_g: log.carbs_g ?? 0,
      fat_g: log.fat_g ?? 0,
      fiber_g: log.fiber_g ?? 0,
    });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleReEstimate = async () => {
    const trimmed = editForm.food_summary.trim();
    if (!trimmed) return;

    setIsReEstimating(true);
    try {
      const res = await fetch('/api/logMeal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: trimmed }),
      });

      if (!res.ok) throw new Error('Failed to analyze with AI');
      const data = await res.json();

      if (!data.is_valid) {
        showToast(data.error_message || 'Could not estimate nutrition for this meal.', 'error');
        return;
      }

      setEditForm((prev) => ({
        ...prev,
        calories: Number(data.calories) || 0,
        protein_g: Number(data.protein_g) || 0,
        carbs_g: Number(data.carbs_g) || 0,
        fat_g: Number(data.fat_g) || 0,
        fiber_g: Number(data.fiber_g) || 0,
      }));
      showToast('Nutritional facts recalculated!', 'success');
    } catch (err) {
      console.error('Re-estimate error:', err);
      showToast('AI estimation failed. You can adjust numbers manually.', 'warning');
    } finally {
      setIsReEstimating(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!log.docId) return;

    setIsSaving(true);
    try {
      const logRef = doc(db, 'daily_logs', log.docId);
      await updateDoc(logRef, {
        food_summary: editForm.food_summary.trim(),
        calories: Number(editForm.calories) || 0,
        protein_g: Number(editForm.protein_g) || 0,
        carbs_g: Number(editForm.carbs_g) || 0,
        fat_g: Number(editForm.fat_g) || 0,
        fiber_g: Number(editForm.fiber_g) || 0,
        updated_at: new Date().toISOString(),
      });
      setIsEditing(false);
      showToast('Meal updated successfully.', 'success');
    } catch (err) {
      console.error('Error updating meal log:', err);
      showToast('Failed to save changes. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!log.docId) return;
    const ok = await showConfirm(`Delete "${log.food_summary}"?`);
    if (!ok) return;

    try {
      await deleteDoc(doc(db, 'daily_logs', log.docId));
      showToast('Meal deleted.', 'info');
    } catch (err) {
      console.error('Error deleting meal log:', err);
      showToast('Failed to delete meal log.', 'error');
    }
  };

  if (isEditing) {
    return (
      <form
        onSubmit={handleSave}
        className="bg-surface-2 rounded-2xl p-4 border border-zinc-700/70 space-y-3"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-300">Edit Meal Log</span>
          <button
            type="button"
            onClick={handleDelete}
            className="text-xs text-rose-400 hover:text-rose-300 font-medium transition-colors"
          >
            Delete Log
          </button>
        </div>

        {/* Meal description & AI re-estimate button */}
        <div>
          <label className="block text-[11px] text-zinc-400 font-medium mb-1">
            Food Description
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              required
              value={editForm.food_summary}
              onChange={(e) => setEditForm({ ...editForm, food_summary: e.target.value })}
              className="flex-1 bg-surface-3 text-white placeholder-zinc-600 rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-zinc-500 border border-zinc-700/50"
            />
            <button
              type="button"
              onClick={handleReEstimate}
              disabled={isReEstimating || !editForm.food_summary.trim()}
              title="Recalculate nutrition with AI"
              className="shrink-0 px-2.5 py-1.5 rounded-xl bg-surface-3 text-cyan-400 hover:text-cyan-300 text-xs font-semibold border border-cyan-800/40 disabled:opacity-40 transition-all flex items-center gap-1"
            >
              {isReEstimating ? '...' : '✨ AI Recalc'}
            </button>
          </div>
        </div>

        {/* Numeric Macros Grid */}
        <div className="grid grid-cols-5 gap-2 pt-1">
          <div>
            <label className="block text-[10px] text-zinc-400 uppercase font-medium mb-0.5">
              Cal
            </label>
            <input
              type="number"
              min="0"
              value={editForm.calories}
              onChange={(e) => setEditForm({ ...editForm, calories: e.target.value })}
              className="w-full bg-surface-3 text-white rounded-lg px-2 py-1.5 text-xs text-center tabular-nums outline-none border border-zinc-700/50"
            />
          </div>
          <div>
            <label className="block text-[10px] text-emerald-400 uppercase font-medium mb-0.5">
              Pro (g)
            </label>
            <input
              type="number"
              min="0"
              value={editForm.protein_g}
              onChange={(e) => setEditForm({ ...editForm, protein_g: e.target.value })}
              className="w-full bg-surface-3 text-white rounded-lg px-2 py-1.5 text-xs text-center tabular-nums outline-none border border-zinc-700/50"
            />
          </div>
          <div>
            <label className="block text-[10px] text-sky-400 uppercase font-medium mb-0.5">
              Carb (g)
            </label>
            <input
              type="number"
              min="0"
              value={editForm.carbs_g}
              onChange={(e) => setEditForm({ ...editForm, carbs_g: e.target.value })}
              className="w-full bg-surface-3 text-white rounded-lg px-2 py-1.5 text-xs text-center tabular-nums outline-none border border-zinc-700/50"
            />
          </div>
          <div>
            <label className="block text-[10px] text-rose-400 uppercase font-medium mb-0.5">
              Fat (g)
            </label>
            <input
              type="number"
              min="0"
              value={editForm.fat_g}
              onChange={(e) => setEditForm({ ...editForm, fat_g: e.target.value })}
              className="w-full bg-surface-3 text-white rounded-lg px-2 py-1.5 text-xs text-center tabular-nums outline-none border border-zinc-700/50"
            />
          </div>
          <div>
            <label className="block text-[10px] text-lime-400 uppercase font-medium mb-0.5">
              Fib (g)
            </label>
            <input
              type="number"
              min="0"
              value={editForm.fiber_g}
              onChange={(e) => setEditForm({ ...editForm, fiber_g: e.target.value })}
              className="w-full bg-surface-3 text-white rounded-lg px-2 py-1.5 text-xs text-center tabular-nums outline-none border border-zinc-700/50"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-2 border-t border-surface-3/50">
          <button
            type="button"
            onClick={handleCancelEdit}
            disabled={isSaving}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-1.5 rounded-lg bg-white text-black text-xs font-semibold hover:bg-zinc-200 transition-colors shadow-sm disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="group bg-surface-2 rounded-xl p-3.5 border border-surface-3/60 hover:border-zinc-700/70 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium leading-snug">
            {log.food_summary}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-zinc-600 text-xs">
              {log.timestamp ? new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
            </span>
            {log.input_method === 'vision' && (
              <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-400">
                Photo
              </span>
            )}
            {log.input_method === 'staple' && (
              <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-400">
                Staple
              </span>
            )}
            <button
              data-testid="edit-meal-btn"
              onClick={handleStartEdit}
              className="text-xs text-zinc-500 hover:text-white transition-colors font-medium ml-1 flex items-center gap-1"
              title="Edit meal description or macros"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
                <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
              </svg>
              <span>Edit</span>
            </button>
            {/* Pin to Staples */}
            {onPinStaple && (
              <button
                data-testid="pin-staple-btn"
                onClick={() => onPinStaple(log)}
                className={`text-xs transition-colors font-medium ml-0.5 flex items-center gap-0.5 ${
                  isPinned
                    ? 'text-amber-400 hover:text-amber-300'
                    : 'text-zinc-500 hover:text-amber-400'
                }`}
                title={isPinned ? 'Remove from staples' : 'Pin to staples'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                  <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
                </svg>
                <span>{isPinned ? 'Pinned' : 'Pin'}</span>
              </button>
            )}
            {/* Delete (trash icon) */}
            <button
              data-testid="delete-meal-btn"
              onClick={handleDelete}
              className="text-xs text-zinc-500 hover:text-rose-400 transition-colors font-medium ml-0.5 flex items-center gap-0.5"
              title="Delete meal"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.519.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        {/* Calories and Protein header counters */}
        <div className="flex gap-4 text-right shrink-0">
          <div>
            <p className="text-white text-sm font-semibold tabular-nums">{log.calories}</p>
            <p className="text-zinc-600 text-[10px] uppercase">cal</p>
          </div>
          <div>
            <p className="text-white text-sm font-semibold tabular-nums">{log.protein_g}</p>
            <p className="text-zinc-600 text-[10px] uppercase">pro</p>
          </div>
        </div>
      </div>

      {/* Secondary Macro Badges */}
      {((Number(log.carbs_g) || 0) > 0 || (Number(log.fat_g) || 0) > 0 || (Number(log.fiber_g) || 0) > 0) && (
        <div className="flex gap-1.5 mt-2 flex-wrap pt-2 border-t border-surface-3/30">
          {(Number(log.carbs_g) || 0) > 0 && (
            <span className="px-2 py-0.5 rounded-md bg-sky-950/40 text-sky-400 text-[10px] font-medium border border-sky-800/30">
              {log.carbs_g}g carbs
            </span>
          )}
          {(Number(log.fat_g) || 0) > 0 && (
            <span className="px-2 py-0.5 rounded-md bg-rose-950/40 text-rose-400 text-[10px] font-medium border border-rose-800/30">
              {log.fat_g}g fat
            </span>
          )}
          {(Number(log.fiber_g) || 0) > 0 && (
            <span className="px-2 py-0.5 rounded-md bg-lime-950/40 text-lime-400 text-[10px] font-medium border border-lime-800/30">
              {log.fiber_g}g fiber
            </span>
          )}
        </div>
      )}
    </div>
  );
}
