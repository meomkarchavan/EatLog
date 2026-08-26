/**
 * LookupPanel — a dedicated full-screen panel for Quick Lookup.
 * Allows searching food nutrition stats without logging immediately,
 * saves queries to a persistent user history in Firestore, and provides
 * Quick-Add and Delete actions directly from history.
 */
import { useState, useEffect, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { PlusCircle, History, Trash2 } from 'lucide-react';
import LookupCard from './LookupCard';
import { useToast } from './Toast';
import { auth } from '../firebase';
import {
  saveLookupToHistory,
  subscribeLookupHistory,
  deleteLookupFromHistory,
} from '../services/lookupHistory';

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
  const [results, setResults] = useState([]); // session search history
  const [history, setHistory] = useState([]); // persistent Firestore history
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const inputRef = useRef(null);

  // Real-time listener for persistent lookup history across tab switches
  useEffect(() => {
    let unsubscribeFirestore = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        setHistory([]);
        setIsLoadingHistory(false);
        return;
      }

      setIsLoadingHistory(true);
      unsubscribeFirestore = subscribeLookupHistory(
        currentUser.uid,
        (pastLookups) => {
          setHistory(pastLookups);
          setIsLoadingHistory(false);
        },
        (err) => {
          console.error('Error in lookup history subscription:', err);
          setIsLoadingHistory(false);
        }
      );
    });

    return () => {
      unsubscribeAuth();
      unsubscribeFirestore();
    };
  }, []);

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

      const lookupItem = {
        id: crypto.randomUUID(),
        food_summary: data.food_summary,
        calories: Number(data.calories) || 0,
        protein_g: Number(data.protein_g) || 0,
        carbs_g: Number(data.carbs_g) || 0,
        fat_g: Number(data.fat_g) || 0,
        fiber_g: Number(data.fiber_g) || 0,
      };

      // Prepend to current session state
      setResults((prev) => [lookupItem, ...prev]);
      setQuery('');

      // Persist to Firestore
      const uid = auth.currentUser?.uid;
      if (uid) {
        try {
          await saveLookupToHistory(uid, lookupItem);
        } catch (saveErr) {
          console.error('Failed to save to lookup history:', saveErr);
          setHistory((prev) => [lookupItem, ...prev]);
        }
      } else {
        setHistory((prev) => [lookupItem, ...prev]);
      }
    } catch (err) {
      console.error('Lookup error:', err);
      showToast('Something went wrong. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToDailyLog = (item) => {
    console.log('Quick-Add item to daily log:', item);
    showToast(`Added "${item.food_summary}" to daily log!`, 'success');
  };

  const handleDeleteHistoryItem = async (id) => {
    if (!id) return;
    try {
      // Optimistically remove from state
      setHistory((prev) => prev.filter((item) => item.id !== id));
      await deleteLookupFromHistory(id);
      showToast('Removed from lookup history', 'info');
    } catch (err) {
      console.error('Failed to delete lookup history entry:', err);
      showToast('Could not delete history item', 'error');
    }
  };

  const dismissResult = (id) => {
    setResults((prev) => prev.filter((r) => r.id !== id));
  };

  const clearAll = () => setResults([]);

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Panel Header */}
      <section className="px-3.5 sm:px-5 pt-3.5 sm:pt-4 pb-2.5 sm:pb-3">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center shrink-0">
            <SearchIcon className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <h2 className="text-white text-base font-bold leading-tight">Quick Lookup</h2>
            <p className="text-zinc-500 text-[11px] leading-tight">
              Search nutrition facts and quick-add to your log
            </p>
          </div>
        </div>
      </section>

      {/* Search Input — fixed at top of panel */}
      <div className="px-3.5 sm:px-5 pb-3">
        <form onSubmit={handleSubmit} className="flex items-center gap-1.5 sm:gap-2">
          <input
            ref={inputRef}
            id="lookup-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search food stats..."
            disabled={isLoading}
            className="flex-1 min-w-0 bg-surface-2 text-white placeholder-zinc-600 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm outline-none focus:ring-1 border border-violet-500/30 focus:ring-violet-500/40 transition-colors disabled:opacity-30"
          />
          <button
            id="lookup-submit-btn"
            type="submit"
            disabled={isLoading || !query.trim()}
            className="shrink-0 w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl bg-violet-600 text-white active:scale-95 transition-all disabled:opacity-20"
          >
            <SendIcon />
          </button>
        </form>
      </div>

      {/* Divider */}
      <div className="h-px bg-surface-3 mx-3.5 sm:mx-5" />

      {/* Scrollable Content: Session Results + Recent Lookups */}
      <section className="flex-1 overflow-y-auto px-3.5 sm:px-5 py-3 space-y-4 pb-28">
        {/* Loading indicator */}
        {isLoading && (
          <div className="bg-surface-2 rounded-2xl p-4 border border-surface-3 text-center">
            <p className="text-white text-sm font-medium animate-pulse-slow">
              Looking up nutrition facts...
            </p>
          </div>
        )}

        {/* Current Session Results */}
        {results.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">
                Current Search ({results.length})
              </span>
              <button
                onClick={clearAll}
                className="text-[11px] text-zinc-500 hover:text-zinc-300 font-medium transition-colors"
              >
                Clear All
              </button>
            </div>

            {results.map((result) => (
              <LookupCard
                key={result.id}
                data={result}
                onDismiss={() => dismissResult(result.id)}
                onAddToDailyLog={handleAddToDailyLog}
              />
            ))}
          </div>
        )}

        {/* Empty state when no session results & no query */}
        {results.length === 0 && !isLoading && history.length === 0 && !isLoadingHistory && (
          <div className="flex flex-col items-center justify-center pt-10 pb-6">
            <div className="w-14 h-14 rounded-2xl bg-surface-2 border border-surface-3 flex items-center justify-center mb-4">
              <SearchIcon className="w-7 h-7 text-zinc-600" />
            </div>
            <p className="text-zinc-400 text-sm text-center font-medium">
              Search any food to see its nutrition
            </p>
            <p className="text-zinc-600 text-xs text-center mt-1">
              e.g. "2 scrambled eggs", "chicken biryani", "1 banana"
            </p>
          </div>
        )}

        {/* Recent Lookups History Section */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-violet-400" />
              <h3 className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">
                Recent Lookups
              </h3>
            </div>
            {history.length > 0 && (
              <span className="text-[10px] text-zinc-600 font-medium">
                Last {history.length}
              </span>
            )}
          </div>

          {isLoadingHistory ? (
            <div className="space-y-2">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="bg-surface-2/60 border border-surface-3/50 rounded-xl p-3 animate-pulse h-14"
                />
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="bg-surface-2/40 border border-surface-3/40 rounded-xl p-4 text-center">
              <p className="text-zinc-500 text-xs font-medium">No past lookups yet</p>
              <p className="text-zinc-600 text-[11px] mt-0.5">
                Foods you search will appear here for quick access
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((item, index) => (
                <div
                  key={item.id || index}
                  className="group bg-surface-2 hover:bg-surface-3/70 border border-surface-3 hover:border-violet-500/30 rounded-xl p-3 flex items-center justify-between gap-3 transition-all duration-200"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-white text-xs sm:text-sm font-medium leading-snug break-words">
                      {item.food_summary}
                    </p>
                    {/* All macros displayed clearly */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-zinc-800/90 text-[11px] font-semibold text-amber-400 tabular-nums border border-zinc-700/40">
                        {item.calories} kcal
                      </span>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-zinc-800/90 text-[11px] font-semibold text-emerald-400 tabular-nums border border-zinc-700/40">
                        {item.protein_g}g P
                      </span>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-zinc-800/90 text-[11px] font-semibold text-sky-400 tabular-nums border border-zinc-700/40">
                        {item.carbs_g}g C
                      </span>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-zinc-800/90 text-[11px] font-semibold text-rose-400 tabular-nums border border-zinc-700/40">
                        {item.fat_g}g F
                      </span>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-zinc-800/90 text-[11px] font-semibold text-lime-400 tabular-nums border border-zinc-700/40">
                        {item.fiber_g}g Fib
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-1.5">
                    <button
                      id={`quick-add-history-${item.id || index}`}
                      onClick={() => handleAddToDailyLog(item)}
                      title="Quick-Add to Daily Log"
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-violet-600/20 hover:bg-violet-600 text-violet-300 hover:text-white text-xs font-medium border border-violet-500/30 hover:border-violet-500 transition-all active:scale-95"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                    <button
                      id={`delete-history-${item.id || index}`}
                      onClick={() => handleDeleteHistoryItem(item.id)}
                      title="Delete from history"
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/15 transition-all active:scale-95"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
