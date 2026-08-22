/**
 * LookupCard — temporary info card displaying nutritional facts
 * from a Quick Lookup query. Not a logged entry.
 * Styled with a violet-tinted border to distinguish from logged MealCards.
 */

export default function LookupCard({ data, onDismiss }) {
  if (!data) return null;

  const macros = [
    { label: 'Calories', value: data.calories, unit: 'kcal', color: 'text-amber-400' },
    { label: 'Protein', value: data.protein_g, unit: 'g', color: 'text-emerald-400' },
    { label: 'Carbs', value: data.carbs_g, unit: 'g', color: 'text-sky-400' },
    { label: 'Fat', value: data.fat_g, unit: 'g', color: 'text-rose-400' },
    { label: 'Fiber', value: data.fiber_g, unit: 'g', color: 'text-lime-400' },
  ];

  return (
    <div className="lookup-card-enter bg-surface-2/95 backdrop-blur-sm rounded-2xl p-4 border border-violet-500/30 shadow-lg shadow-violet-950/20">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="shrink-0 px-1.5 py-0.5 rounded-md bg-violet-950/50 text-violet-400 text-[10px] font-semibold uppercase tracking-wider border border-violet-800/30">
            Lookup
          </span>
          <p className="text-white text-sm font-medium leading-snug truncate">
            {data.food_summary}
          </p>
        </div>
        <button
          id="lookup-dismiss-btn"
          onClick={onDismiss}
          title="Dismiss"
          className="shrink-0 w-6 h-6 flex items-center justify-center rounded-lg text-zinc-500 hover:text-white hover:bg-surface-3 transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>
      </div>

      {/* Macro grid */}
      <div className="grid grid-cols-5 gap-2">
        {macros.map((m) => (
          <div key={m.label} className="text-center">
            <p className={`text-base font-bold tabular-nums ${m.color}`}>
              {m.value}
            </p>
            <p className="text-zinc-500 text-[10px] font-medium uppercase tracking-wider">
              {m.label}
            </p>
          </div>
        ))}
      </div>

      {/* Footer hint */}
      <p className="text-zinc-600 text-[10px] text-center mt-3 pt-2 border-t border-surface-3/50">
        This is a quick lookup — not logged to your daily intake.
      </p>
    </div>
  );
}
