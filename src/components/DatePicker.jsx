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

export default function DatePicker({ selectedDate, onSelectDate, isOpen, onClose }) {
  // Parse selectedDate (YYYY-MM-DD) to determine initial view month
  const [selYear, selMonth] = selectedDate.split('-').map(Number);
  const [viewYear, setViewYear] = useState(selYear);
  const [viewMonth, setViewMonth] = useState(selMonth); // 1-indexed

  const todayStr = new Date().toLocaleDateString('en-CA');

  // Build calendar grid for viewYear/viewMonth
  const calendarDays = useMemo(() => {
    const firstOfMonth = new Date(viewYear, viewMonth - 1, 1);
    const lastOfMonth = new Date(viewYear, viewMonth, 0);
    const daysInMonth = lastOfMonth.getDate();

    let startDay = firstOfMonth.getDay() - 1;
    if (startDay < 0) startDay = 6;

    const days = [];

    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = new Date(viewYear, viewMonth - 1, d).toLocaleDateString('en-CA');
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
      className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 transition-opacity"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-surface-1 border-t sm:border border-border/80 rounded-t-[28px] sm:rounded-3xl p-5 pb-8 sm:pb-6 lookup-card-enter shadow-2xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle top glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-macro-protein/30 to-transparent pointer-events-none" />

        {/* Header: Month/Year + Nav */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={goToPrevMonth}
            aria-label="Previous Month"
            className="w-9 h-9 flex items-center justify-center rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-2 active:scale-95 transition-all border border-border/40"
          >
            <ChevronLeftIcon />
          </button>
          <h3 className="text-text-primary text-base font-bold tracking-tight">
            {MONTH_NAMES[viewMonth - 1]} {viewYear}
          </h3>
          <button
            onClick={goToNextMonth}
            aria-label="Next Month"
            className="w-9 h-9 flex items-center justify-center rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-2 active:scale-95 transition-all border border-border/40"
          >
            <ChevronRightIcon />
          </button>
        </div>

        {/* Day-of-week labels */}
        <div className="grid grid-cols-7 gap-1 mb-1.5">
          {DAY_LABELS.map((d) => (
            <div key={d} className="text-center text-text-dim text-[10px] font-bold uppercase tracking-wider py-1 font-mono">
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
                className={`w-full aspect-square flex items-center justify-center rounded-xl text-xs sm:text-sm font-semibold font-stat-mono transition-all
                  ${isSelected
                    ? 'bg-macro-protein text-surface-0 font-bold shadow-[0_0_14px_rgba(34,197,94,0.35)] scale-95'
                    : isToday
                      ? 'bg-surface-2 text-macro-water font-bold border border-macro-water/40'
                      : isFuture
                        ? 'text-text-dim/30 cursor-not-allowed opacity-40'
                        : 'text-text-primary hover:bg-surface-2 active:scale-90 border border-transparent hover:border-border/60'
                  }`}
              >
                {dayNum}
              </button>
            );
          })}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-border/70">
          <button
            onClick={goToToday}
            className="text-xs text-macro-protein font-semibold hover:text-emerald-300 transition-colors font-mono py-1 px-2.5 rounded-lg bg-macro-protein/10 border border-macro-protein/25 active:scale-95"
          >
            Go to Today
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold text-text-muted hover:text-text-primary bg-surface-2 hover:bg-surface-3 transition-colors border border-border/60 active:scale-95"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
