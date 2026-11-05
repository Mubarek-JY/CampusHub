import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { CheckCircle2, X, XCircle } from 'lucide-react';

type ToastItem = { id: number; message: string; type: 'success' | 'error' };
type ToastContextValue = { toast: (message: string, type?: ToastItem['type']) => void };
const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const toast = useCallback((message: string, type: ToastItem['type'] = 'success') => {
    const id = Date.now() + Math.random();
    setItems((current) => [...current, { id, message, type }]);
    window.setTimeout(() => setItems((current) => current.filter((item) => item.id !== id)), 4200);
  }, []);
  const value = useMemo(() => ({ toast }), [toast]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-[100] flex w-[min(92vw,380px)] flex-col gap-2" aria-live="polite">
        {items.map((item) => (
          <div key={item.id} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-soft dark:border-slate-700 dark:bg-slate-900">
            {item.type === 'success' ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" /> : <XCircle className="mt-0.5 size-4 shrink-0 text-rose-600" />}
            <p className="flex-1 text-slate-700 dark:text-slate-200">{item.message}</p>
            <button aria-label="Dismiss notification" onClick={() => setItems((current) => current.filter((x) => x.id !== item.id))}><X className="size-4 text-slate-400" /></button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside ToastProvider');
  return context;
};
