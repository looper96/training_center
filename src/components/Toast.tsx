import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, Info, X, ShieldAlert } from 'lucide-react';

export type ToastType = 'success' | 'warning' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

type ToastListener = (toast: ToastMessage) => void;
const listeners: ToastListener[] = [];

export const showToast = (message: string, type: ToastType = 'info') => {
  const toast: ToastMessage = {
    id: 'toast_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    message,
    type
  };
  listeners.forEach(fn => fn(toast));
};

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handleNewToast = (t: ToastMessage) => {
      setToasts(prev => [...prev.slice(-3), t]); // keep maximum 4 toasts
      setTimeout(() => {
        setToasts(prev => prev.filter(item => item.id !== t.id));
      }, 4000);
    };

    listeners.push(handleNewToast);
    return () => {
      const idx = listeners.indexOf(handleNewToast);
      if (idx !== -1) listeners.splice(idx, 1);
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-6 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none select-none">
      {toasts.map(t => {
        let bg = 'bg-white border-amber-300 text-amber-950';
        let icon = <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />;

        if (t.type === 'success') {
          bg = 'bg-emerald-50 border-emerald-300 text-emerald-950';
          icon = <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />;
        } else if (t.type === 'error') {
          bg = 'bg-rose-50 border-rose-300 text-rose-950';
          icon = <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />;
        } else if (t.type === 'info') {
          bg = 'bg-blue-50 border-blue-300 text-blue-950';
          icon = <Info className="w-5 h-5 text-blue-600 shrink-0" />;
        }

        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-2xl border shadow-lg shadow-black/5 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 duration-200 ${bg}`}
          >
            <div className="flex items-center gap-2.5">
              {icon}
              <span className="leading-relaxed">{t.message}</span>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="p-1 rounded-lg hover:bg-black/5 text-stone-500 hover:text-stone-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
