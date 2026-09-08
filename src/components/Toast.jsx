import { createContext, useContext, useState, useCallback, useRef } from 'react';

const ToastContext = createContext(null);

const defaultContext = {
  showToast: () => {},
  showConfirm: async () => true,
};

export function useToast() {
  const ctx = useContext(ToastContext);
  return ctx || defaultContext;
}

// --- Toast Notification ---
function ToastItem({ toast, onDismiss }) {
  const colors = {
    success: 'border-macro-protein/40 text-macro-protein bg-surface-2/95 shadow-[0_4px_20px_rgba(34,197,94,0.15)]',
    error: 'border-rose-500/40 text-rose-400 bg-surface-2/95 shadow-[0_4px_20px_rgba(244,63,94,0.15)]',
    info: 'border-macro-water/40 text-macro-water bg-surface-2/95 shadow-[0_4px_20px_rgba(56,189,248,0.15)]',
    warning: 'border-macro-calories/40 text-macro-calories bg-surface-2/95 shadow-[0_4px_20px_rgba(250,204,21,0.15)]',
  };

  const icons = {
    success: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-macro-protein shrink-0">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
      </svg>
    ),
    error: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-rose-400 shrink-0">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
      </svg>
    ),
    info: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-macro-water shrink-0">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
      </svg>
    ),
    warning: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-macro-calories shrink-0">
        <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
      </svg>
    ),
  };

  return (
    <div
      className={`flex items-center gap-3 backdrop-blur-xl rounded-2xl px-4 py-3.5 border shadow-2xl lookup-card-enter ${colors[toast.type] || colors.info}`}
    >
      {icons[toast.type] || icons.info}
      <p className="text-sm font-medium flex-1 text-text-primary">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss toast"
        className="text-text-muted hover:text-text-primary transition-colors shrink-0 p-1 rounded-lg hover:bg-surface-3"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
          <path d="M5.28 4.22a.75.75 0 00-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 101.06 1.06L8 9.06l2.72 2.72a.75.75 0 101.06-1.06L9.06 8l2.72-2.72a.75.75 0 00-1.06-1.06L8 6.94 5.28 4.22z" />
        </svg>
      </button>
    </div>
  );
}

// --- Confirm Modal ---
function ConfirmModalUI({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[60] p-6" onClick={onCancel}>
      <div
        className="w-full max-w-xs bg-surface-1 rounded-2xl border border-border/80 p-5 lookup-card-enter shadow-2xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500/40 via-rose-500/80 to-rose-500/40" />
        <p className="text-text-primary text-sm font-medium text-center mb-5 leading-relaxed pt-1">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-text-muted bg-surface-2 hover:bg-surface-3 hover:text-text-primary transition-all border border-border/60 active:scale-95"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 transition-all shadow-md shadow-rose-950/40 active:scale-95"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Provider ---
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [confirmState, setConfirmState] = useState(null);
  const confirmResolve = useRef(null);

  const showToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type }]);
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showConfirm = useCallback((message) => {
    return new Promise((resolve) => {
      confirmResolve.current = resolve;
      setConfirmState({ message });
    });
  }, []);

  const handleConfirm = () => {
    confirmResolve.current?.(true);
    setConfirmState(null);
  };

  const handleCancel = () => {
    confirmResolve.current?.(false);
    setConfirmState(null);
  };

  return (
    <ToastContext.Provider value={{ showToast, showConfirm }}>
      {children}

      {/* Toast stack */}
      {toasts.length > 0 && (
        <div className="fixed top-4 left-4 right-4 z-[70] flex flex-col gap-2 pointer-events-none">
          {toasts.map((toast) => (
            <div key={toast.id} className="pointer-events-auto">
              <ToastItem toast={toast} onDismiss={dismissToast} />
            </div>
          ))}
        </div>
      )}

      {/* Confirm modal */}
      {confirmState && (
        <ConfirmModalUI
          message={confirmState.message}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </ToastContext.Provider>
  );
}
