/**
 * LookupPanel — a dedicated full-screen panel for Quick Lookup.
 * Self-contained: owns its own search input, API calls, loading state,
 * and session-scoped results history. Does NOT write to Firestore.
 */
import { useState, useRef } from 'react';
import LookupCard from './LookupCard';
import { useToast } from './Toast';

function SearchIcon({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || 'w-5 h-5'}>
      <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
    </svg>
  );
}

export default function LookupPanel() {
  const { showToast } = useToast();
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState([]); // session history, newest first
  const inputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed || isLoading) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/logMeal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: trimmed }),
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      const data = await res.json();

      if (!data.is_valid) {
        showToast(data.error_message || 'Could not identify the food.', 'error');
        return;
      }

      // Prepend to session history (no Firestore write)
      setResults((prev) => [
        {
          id: crypto.randomUUID(),
          food_summary: data.food_summary,
          calories: Number(data.calories) || 0,
          protein_g: Number(data.protein_g) || 0,
          carbs_g: Number(data.carbs_g) || 0,
          fat_g: Number(data.fat_g) || 0,
          fiber_g: Number(data.fiber_g) || 0,
        },
        ...prev,
      ]);
      setQuery('');
    } catch (err) {
      console.error('Lookup error:', err);
      showToast('Something went wrong. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const dismissResult = (id) => {
    setResults((prev) => prev.filter((r) => r.id !== id));
  };

  const clearAll = () => setResults([]);

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Panel Header */}
      <section className="px-5 pt-4 pb-3">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
            <SearchIcon className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <h2 className="text-white text-base font-bold leading-tight">Quick Lookup</h2>
            <p className="text-zinc-500 text-[11px] leading-tight">
              Search nutrition facts without logging
            </p>
          </div>
        </div>
      </section>

      {/* Search Input — fixed at top of panel */}
      <div className="px-5 pb-3">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            ref={inputRef}
            id="lookup-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search food stats..."
            disabled={isLoading}
            className="flex-1 bg-surface-2 text-white placeholder-zinc-600 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 border border-violet-500/30 focus:ring-violet-500/40 transition-colors disabled:opacity-30"
          />
          <button
            id="lookup-submit-btn"
            type="submit"
            disabled={isLoading || !query.trim()}
            className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-violet-600 text-white active:scale-95 transition-all disabled:opacity-20"
          >
            <SendIcon />
          </button>
        </form>
      </div>

      {/* Divider */}
      <div className="h-px bg-surface-3 mx-5" />

      {/* Results Feed */}
      <section className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
        {/* Loading indicator */}
        {isLoading && (
          <div className="bg-surface-2 rounded-2xl p-4 border border-surface-3 text-center">
            <p className="text-white text-sm font-medium animate-pulse-slow">
              Looking up nutrition facts...
            </p>
          </div>
        )}

        {/* Results */}
        {results.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center pt-16 pb-8">
            <div className="w-14 h-14 rounded-2xl bg-surface-2 border border-surface-3 flex items-center justify-center mb-4">
              <SearchIcon className="w-7 h-7 text-zinc-600" />
            </div>
            <p className="text-zinc-500 text-sm text-center font-medium">
              Search any food to see its nutrition
            </p>
            <p className="text-zinc-600 text-xs text-center mt-1">
              e.g. "2 scrambled eggs", "chicken biryani", "1 banana"
            </p>
          </div>
        )}

        {results.length > 0 && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500 text-[10px] font-medium uppercase tracking-wider">
                {results.length} result{results.length !== 1 ? 's' : ''}
              </span>
              <button
                onClick={clearAll}
                className="text-[10px] text-zinc-600 hover:text-zinc-400 font-medium transition-colors"
              >
                Clear All
              </button>
            </div>

            {results.map((result) => (
              <LookupCard
                key={result.id}
                data={result}
                onDismiss={() => dismissResult(result.id)}
              />
            ))}
          </>
        )}
      </section>
    </div>
  );
}
