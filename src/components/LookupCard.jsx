import { PlusCircle, Loader2 } from 'lucide-react';

export default function LookupCard({ data, onDismiss, onAddToDailyLog, isAdding = false }) {
  if (!data) return null;

  const macros = [
    { label: 'Calories', value: data.calories, unit: 'kcal', color: 'text-[#facc15]' },
    { label: 'Protein', value: data.protein_g, unit: 'g', color: 'text-[#22c55e]' },
    { label: 'Carbs', value: data.carbs_g, unit: 'g', color: 'text-[#38bdf8]' },
    { label: 'Fat', value: data.fat_g, unit: 'g', color: 'text-[#fb923c]' },
    { label: 'Fiber', value: data.fiber_g, unit: 'g', color: 'text-[#a78bfa]' },
  ];

  return (
    <div className="lookup-card-enter bg-[#121316] rounded-2xl p-3.5 sm:p-4 border border-white/[0.08] shadow-[0_4px_16px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.03)]">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="shrink-0 px-2 py-0.5 rounded-md bg-[#1a1c22] text-[#38bdf8] text-[10px] font-bold uppercase tracking-wider border border-[#38bdf8]/30 font-mono">
            Lookup
          </span>
          <p className="text-[#f3f4f6] text-sm font-semibold leading-snug break-words">
            {data.food_summary}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {onAddToDailyLog && (
            <button
              id={`lookup-add-btn-${data.id || 'current'}`}
              onClick={() => onAddToDailyLog(data)}
              disabled={isAdding}
              title={isAdding ? 'Adding to log...' : 'Add to daily log'}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#22c55e]/15 hover:bg-[#22c55e]/25 text-[#22c55e] hover:text-emerald-300 text-xs font-bold border border-[#22c55e]/40 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-mono shadow-sm"
            >
              {isAdding ? (
                <Loader2 className="w-3.5 h-3.5 text-[#22c55e] animate-spin" />
              ) : (
                <PlusCircle className="w-3.5 h-3.5 text-[#22c55e]" />
              )}
              <span>{isAdding ? 'Adding...' : 'Add'}</span>
            </button>
          )}
          {onDismiss && (
            <button
              id="lookup-dismiss-btn"
              onClick={onDismiss}
              title="Dismiss"
              className="w-7 h-7 flex items-center justify-center rounded-lg text-[#6b7280] hover:text-[#f3f4f6] hover:bg-white/[0.08] transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Macro grid */}
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2 bg-[#0f1013] p-2.5 rounded-xl border border-white/[0.05]">
        {macros.map((m) => (
          <div key={m.label} className="text-center">
            <p className={`text-sm sm:text-base font-bold font-stat-mono leading-none ${m.color}`}>
              {m.value}
            </p>
            <p className="text-[#6b7280] text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider truncate mt-1">
              {m.label}
            </p>
          </div>
        ))}
      </div>

      {/* Footer note */}
      <p className="text-[#6b7280] text-[10px] text-center mt-3 pt-2 border-t border-white/[0.06] font-mono">
        This is a quick lookup. Not yet logged to your daily intake.
      </p>
    </div>
  );
}
