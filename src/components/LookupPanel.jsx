import { useState, useEffect, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc } from 'firebase/firestore';
import { PlusCircle, History, Trash2, Loader2 } from 'lucide-react';
import LookupCard from './LookupCard';
import { useToast } from './Toast';
import { auth, db } from '../firebase';
import {
  saveLookupToHistory,
  subscribeLookupHistory,
  deleteLookupFromHistory,
  getLocalLookupHistory,
  saveLocalLookupHistory,
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

export default function LookupPanel({ onAddMeal }) {
  const { showToast } = useToast();
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [addingId, setAddingId] = useState(null); // ID of food currently being logged
  const [results, setResults] = useState([]); // session search results
  const [history, setHistory] = useState(() => getLocalLookupHistory(auth.currentUser?.uid));
  const [isLoadingHistory, setIsLoadingHistory] = useState(() => history.length === 0);
  const inputRef = useRef(null);

  // Real-time listener for persistent lookup history across tab switches
  useEffect(() => {
    let unsubscribeFirestore = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      const uid = currentUser?.uid;
      if (!uid) {
        const local = getLocalLookupHistory(null);
        setHistory(local);
        setIsLoadingHistory(false);
        return;
      }

      // Pre-populate immediately from local storage for 0ms tab-switch latency
      const cached = getLocalLookupHistory(uid);
      if (cached.length > 0) {
        setHistory(cached);
        setIsLoadingHistory(false);
      }

      unsubscribeFirestore = subscribeLookupHistory(
        uid,
        (pastLookups) => {
          if (pastLookups && pastLookups.length > 0) {
            setHistory(pastLookups);
          }
          setIsLoadingHistory(false);
        },
        (err) => {
          console.warn('Lookup history subscription error (using cache):', err);
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
        createdAt: new Date().toISOString(),
      };

      // Prepend to current session state
      setResults((prev) => [lookupItem, ...prev]);
      setQuery('');

      // Immediately update persistent history state and local storage cache
      const uid = auth.currentUser?.uid;
      setHistory((prev) => {
        const next = [lookupItem, ...prev.filter((i) => i.id !== lookupItem.id)];
        saveLocalLookupHistory(uid, next);
        return next;
      });

      // Asynchronously persist to Firestore
      if (uid) {
        try {
          await saveLookupToHistory(uid, lookupItem);
        } catch (saveErr) {
          console.warn('Failed to save to Firestore (saved locally):', saveErr);
        }
      }
    } catch (err) {
      console.error('Lookup error:', err);
      showToast('Something went wrong. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToDailyLog = async (item) => {
    const itemKey = item.id || item.food_summary;
    setAddingId(itemKey);

    try {
      if (onAddMeal) {
        await onAddMeal(item);
        return;
      }

      const uid = auth.currentUser?.uid;
      if (!uid) {
        showToast('Please sign in to log meals', 'error');
        return;
      }

      await addDoc(collection(db, 'daily_logs'), {
        id: crypto.randomUUID(),
        user_id: uid,
        timestamp: new Date().toISOString(),
        food_summary: item.food_summary,
        calories: Number(item.calories) || 0,
        protein_g: Number(item.protein_g) || 0,
        carbs_g: Number(item.carbs_g) || 0,
        fat_g: Number(item.fat_g) || 0,
        fiber_g: Number(item.fiber_g) || 0,
        input_method: 'lookup',
      });
      showToast(`Logged: ${item.food_summary}`, 'success');
    } catch (err) {
      console.error('Failed to log lookup item:', err);
      showToast('Failed to add meal to log.', 'error');
    } finally {
      setAddingId(null);
    }
  };

  const handleDeleteHistoryItem = async (id) => {
    if (!id) return;
    const uid = auth.currentUser?.uid;
    setHistory((prev) => {
      const next = prev.filter((item) => item.id !== id);
      saveLocalLookupHistory(uid, next);
      return next;
    });

    try {
      await deleteLookupFromHistory(id, uid);
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
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[#090a0c]">
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col min-h-0">
        {/* Panel Header */}
        <section className="px-3.5 sm:px-5 pt-3.5 sm:pt-4 pb-2.5 sm:pb-3">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(56,189,248,0.2)]">
              <SearchIcon className="w-4 h-4 text-[#38bdf8]" />
            </div>
            <div>
              <h2 className="text-[#f3f4f6] text-base font-extrabold leading-tight tracking-tight">Quick Lookup</h2>
              <p className="text-[#9ca3af] text-[11px] leading-tight">
                Search instant nutritional breakdown & add to log with 1-tap
              </p>
            </div>
          </div>
        </section>

        {/* Search Input */}
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
              className="flex-1 min-w-0 bg-[#121316] text-[#f3f4f6] placeholder-[#6b7280] rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-sky-500/40 border border-white/[0.08] focus:border-sky-500/60 transition-all disabled:opacity-30 font-sans"
            />
            <button
              id="lookup-submit-btn"
              type="submit"
              disabled={isLoading || !query.trim()}
              className="shrink-0 w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl bg-[#38bdf8] hover:bg-sky-400 text-[#090a0c] active:scale-95 transition-all disabled:opacity-20 shadow-[0_0_12px_rgba(56,189,248,0.3)]"
            >
              <SendIcon />
            </button>
          </form>
        </div>

        {/* Divider */}
        <div className="h-px bg-white/[0.06] mx-3.5 sm:mx-5" />

        {/* Scrollable Content */}
        <section className="flex-1 overflow-y-auto px-3.5 sm:px-5 py-3 space-y-4 pb-28">
        {/* Loading indicator */}
        {isLoading && (
          <div className="bg-[#121316] rounded-2xl p-4 border border-white/[0.08] text-center shadow-lg">
            <p className="text-[#f3f4f6] text-sm font-semibold animate-pulse-slow">
              Looking up nutrition facts with AI...
            </p>
          </div>
        )}

        {/* Current Session Results */}
        {results.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[#9ca3af] text-xs font-semibold uppercase tracking-wider font-mono">
                Current Search ({results.length})
              </span>
              <button
                onClick={clearAll}
                className="text-[11px] text-[#6b7280] hover:text-[#f3f4f6] font-medium transition-colors font-mono"
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
                isAdding={addingId === (result.id || result.food_summary)}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {results.length === 0 && !isLoading && history.length === 0 && !isLoadingHistory && (
          <div className="flex flex-col items-center justify-center pt-10 pb-6 bg-[#121316]/40 rounded-2xl border border-white/[0.05] p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#15171b] border border-white/[0.08] flex items-center justify-center mb-3 shadow-inner">
              <SearchIcon className="w-6 h-6 text-[#6b7280]" />
            </div>
            <p className="text-[#f3f4f6] text-sm font-semibold">
              Search any food to see its nutrition
            </p>
            <p className="text-[#6b7280] text-xs mt-1 font-mono">
              e.g. "2 scrambled eggs", "chicken biryani", "1 banana"
            </p>
          </div>
        )}

        {/* Recent Lookups History */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-[#38bdf8]" />
              <h3 className="text-[#9ca3af] text-xs font-semibold uppercase tracking-wider font-mono">
                Recent Lookups
              </h3>
            </div>
            {history.length > 0 && (
              <span className="text-[10px] text-[#6b7280] font-stat-mono">
                Last {history.length}
              </span>
            )}
          </div>

          {isLoadingHistory ? (
            <div className="space-y-2">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="bg-[#121316] border border-white/[0.06] rounded-2xl p-3 animate-pulse h-14"
                />
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="bg-[#121316]/50 border border-white/[0.06] rounded-2xl p-4 text-center">
              <p className="text-[#9ca3af] text-xs font-medium">No past lookups yet</p>
              <p className="text-[#6b7280] text-[11px] mt-0.5">
                Foods you search will appear here for quick access
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((item, index) => {
                const isItemAdding = addingId === (item.id || item.food_summary);
                return (
                  <div
                    key={item.id || index}
                    className="group bg-[#121316] hover:bg-[#15171b] border border-white/[0.07] hover:border-white/[0.14] rounded-2xl p-3 flex items-center justify-between gap-3 transition-all duration-200 shadow-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-[#f3f4f6] text-xs sm:text-sm font-semibold leading-snug break-words">
                        {item.food_summary}
                      </p>
                      {/* All macros displayed */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5 font-stat-mono">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-lg bg-[#1a1c22] text-[10px] font-bold text-[#facc15] border border-white/[0.06]">
                          {item.calories} kcal
                        </span>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-lg bg-[#1a1c22] text-[10px] font-bold text-[#22c55e] border border-white/[0.06]">
                          {item.protein_g}g P
                        </span>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-lg bg-[#1a1c22] text-[10px] font-bold text-[#38bdf8] border border-white/[0.06]">
                          {item.carbs_g}g C
                        </span>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-lg bg-[#1a1c22] text-[10px] font-bold text-[#fb923c] border border-white/[0.06]">
                          {item.fat_g}g F
                        </span>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-lg bg-[#1a1c22] text-[10px] font-bold text-[#a78bfa] border border-white/[0.06]">
                          {item.fiber_g}g Fib
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5">
                      <button
                        id={`quick-add-history-${item.id || index}`}
                        onClick={() => handleAddToDailyLog(item)}
                        disabled={isItemAdding}
                        title={isItemAdding ? 'Adding to log...' : 'Quick-Add to Daily Log'}
                        className="w-[88px] justify-center flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#22c55e]/15 hover:bg-[#22c55e]/25 text-[#22c55e] text-xs font-bold border border-[#22c55e]/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed font-mono"
                      >
                        {isItemAdding ? (
                          <Loader2 className="w-3.5 h-3.5 text-[#22c55e] animate-spin" />
                        ) : (
                          <PlusCircle className="w-3.5 h-3.5" />
                        )}
                        <span>{isItemAdding ? 'Adding...' : 'Add'}</span>
                      </button>
                      <button
                        id={`delete-history-${item.id || index}`}
                        onClick={() => handleDeleteHistoryItem(item.id)}
                        disabled={isItemAdding}
                        title="Delete from history"
                        className="w-7 h-7 flex items-center justify-center rounded-xl text-[#6b7280] hover:text-rose-400 hover:bg-rose-500/15 transition-all active:scale-95 disabled:opacity-40"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  </div>
);
}
