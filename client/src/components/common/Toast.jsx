import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const STYLES = {
  success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
};

const ICON_STYLES = {
  success: 'text-emerald-500',
  error: 'text-red-500',
  warning: 'text-amber-500',
  info: 'text-blue-500',
};

const PROGRESS_STYLES = {
  success: 'bg-emerald-400',
  error: 'bg-red-400',
  warning: 'bg-amber-400',
  info: 'bg-blue-400',
};

let toastId = 0;

function Toast({ toast, onDismiss }) {
  const Icon = ICONS[toast.type] || Info;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 80, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.9, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={`relative flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg max-w-sm overflow-hidden ${STYLES[toast.type]}`}
    >
      <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${ICON_STYLES[toast.type]}`} />
      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className="font-semibold text-sm">{toast.title}</p>
        )}
        <p className="text-sm opacity-90">{toast.message}</p>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 p-0.5 rounded-md hover:bg-black/5 transition-colors"
      >
        <X className="w-4 h-4 opacity-50" />
      </button>

      {/* Auto-dismiss progress bar */}
      <motion.div
        className={`absolute bottom-0 left-0 h-0.5 ${PROGRESS_STYLES[toast.type]}`}
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: toast.duration / 1000, ease: 'linear' }}
      />
    </motion.div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ type = 'info', title, message, duration = 4000 }) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, type, title, message, duration }]);
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
    return id;
  }, []);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback({
    success: (message, title) => addToast({ type: 'success', message, title }),
    error: (message, title) => addToast({ type: 'error', message, title }),
    warning: (message, title) => addToast({ type: 'warning', message, title }),
    info: (message, title) => addToast({ type: 'info', message, title }),
  }, [addToast]);

  // Fix: toast needs to be a callable object with methods
  const toastApi = useCallback((opts) => addToast(opts), [addToast]);
  toastApi.success = (message, title) => addToast({ type: 'success', message, title });
  toastApi.error = (message, title) => addToast({ type: 'error', message, title });
  toastApi.warning = (message, title) => addToast({ type: 'warning', message, title });
  toastApi.info = (message, title) => addToast({ type: 'info', message, title });

  return (
    <ToastContext.Provider value={toastApi}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 no-print">
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <Toast key={t.id} toast={t} onDismiss={dismiss} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
