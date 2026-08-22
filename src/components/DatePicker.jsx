/**
 * DatePicker — custom dark-mode calendar picker modal.
 * Replaces the native <input type="date"> to match EatLog's UI.
 * Bottom-sheet style on mobile, renders a monthly calendar grid.
 */
import { useState, useMemo } from 'react';

function ChevronLeftIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
    </svg>
  );
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * Pad a number to 2 digits
 */
function pad(n) {
  return String(n).padStart(2, '0');
}

/**
 * Format a Date to YYYY-MM-DD
 */
function toDateStr(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function DatePicker({ selectedDate, onSelectDate, isOpen, onClose }) {
  // Parse selectedDate (YYYY-MM-DD) to determine initial view month
  const [selYear, selMonth] = selectedDate.split('-').map(Number);
  const [viewYear, setViewYear] = useState(selYear);
  const [viewMonth, setViewMonth] = useState(selMonth); // 1-indexed

  const todayStr = toDateStr(new Date());

  // Build calendar grid for viewYear/viewMonth
  const calendarDays = useMemo(() => {
    const firstOfMonth = new Date(viewYear, viewMonth - 1, 1);
    const lastOfMonth = new Date(viewYear, viewMonth, 0);
    const daysInMonth = lastOfMonth.getDate();

    // Monday = 0, Sunday = 6  (JS getDay: 0=Sun, so we remap)
    let startDay = firstOfMonth.getDay() - 1;
    if (startDay < 0) startDay = 6; // Sunday wraps to 6

    const days = [];

    // Empty slots for days before the 1st
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }

    // Actual days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${viewYear}-${pad(viewMonth)}-${pad(d)}`;
      days.push(dateStr);
    }

    return days;
  }, [viewYear, viewMonth]);

  const goToPrevMonth = () => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const goToToday = () => {
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth() + 1);
    onSelectDate(todayStr);
    onClose();
  };

  const handleSelect = (dateStr) => {
    if (!dateStr) return;
    onSelectDate(dateStr);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-end justify-center z-50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-surface-1 border-t border-surface-3 rounded-t-3xl p-5 pb-8 lookup-card-enter"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: Month/Year + Nav */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={goToPrevMonth}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-zinc-400 hover:text-white hover:bg-surface-3 transition-all"
          >
            <ChevronLeftIcon />
          </button>
          <h3 className="text-white text-base font-bold tracking-tight">
            {MONTH_NAMES[viewMonth - 1]} {viewYear}
          </h3>
          <button
            onClick={goToNextMonth}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-zinc-400 hover:text-white hover:bg-surface-3 transition-all"
          >
            <ChevronRightIcon />
          </button>
        </div>

        {/* Day-of-week labels */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {DAY_LABELS.map((d) => (
            <div key={d} className="text-center text-zinc-500 text-[10px] font-semibold uppercase tracking-wider py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((dateStr, i) => {
            if (!dateStr) {
              return <div key={`empty-${i}`} />;
            }

            const dayNum = Number(dateStr.split('-')[2]);
            const isSelected = dateStr === selectedDate;
            const isToday = dateStr === todayStr;
            const isFuture = dateStr > todayStr;

            return (
              <button
                key={dateStr}
                onClick={() => handleSelect(dateStr)}
                disabled={isFuture}
                className={`w-full aspect-square flex items-center justify-center rounded-xl text-sm font-medium transition-all
                  ${isSelected
                    ? 'bg-white text-black font-bold shadow-sm'
                    : isToday
                      ? 'bg-surface-3 text-cyan-400 font-semibold border border-cyan-800/40'
                      : isFuture
                        ? 'text-zinc-700 cursor-not-allowed'
                        : 'text-zinc-300 hover:bg-surface-3 hover:text-white active:scale-90'
                  }`}
              >
                {dayNum}
              </button>
            );
          })}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-surface-3/50">
          <button
            onClick={goToToday}
            className="text-xs text-cyan-400 font-semibold hover:text-cyan-300 transition-colors"
          >
            Go to Today
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
