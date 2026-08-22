/**
 * Toast — lightweight in-app notification system.
 * Replaces all window.alert() and window.confirm() calls.
 *
 * Usage:
 *   import { useToast, ToastProvider, ConfirmModal } from './Toast';
 *
 *   // Wrap app in ToastProvider
 *   <ToastProvider> ... </ToastProvider>
 *
 *   // In any child component:
 *   const { showToast, showConfirm } = useToast();
 *   showToast('Saved!', 'success');
 *   showToast('Something went wrong', 'error');
 *   const ok = await showConfirm('Delete this meal?');
 */
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
    success: 'border-emerald-500/40 text-emerald-300',
    error: 'border-rose-500/40 text-rose-300',
    info: 'border-zinc-500/40 text-zinc-300',
    warning: 'border-amber-500/40 text-amber-300',
  };

  const icons = {
    success: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-emerald-400 shrink-0">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
      </svg>
    ),
    error: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-rose-400 shrink-0">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
      </svg>
    ),
    info: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-zinc-400 shrink-0">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
      </svg>
    ),
    warning: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-amber-400 shrink-0">
        <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
      </svg>
    ),
  };

  return (
    <div
      className={`flex items-center gap-2.5 bg-surface-2/95 backdrop-blur-sm rounded-xl px-4 py-3 border shadow-lg shadow-black/30 lookup-card-enter ${colors[toast.type] || colors.info}`}
    >
      {icons[toast.type] || icons.info}
      <p className="text-sm font-medium flex-1">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-zinc-600 hover:text-zinc-300 transition-colors shrink-0"
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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-[60] p-6" onClick={onCancel}>
      <div
        className="w-full max-w-xs bg-surface-1 rounded-2xl border border-surface-3 p-5 lookup-card-enter"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-white text-sm font-medium text-center mb-5 leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-zinc-400 bg-surface-3 hover:text-white transition-colors border border-zinc-700/50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-rose-600 hover:bg-rose-500 transition-colors"
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
