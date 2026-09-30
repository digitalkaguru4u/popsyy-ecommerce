import { createContext, useCallback, useContext, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

const ToastCtx = createContext(null);
let id = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const dismiss = useCallback((tid) => setToasts((t) => t.filter((x) => x.id !== tid)), []);
  const push = useCallback((message, type = 'success', ms = 3200) => {
    const tid = ++id;
    setToasts((t) => [...t.slice(-3), { id: tid, message, type }]);
    setTimeout(() => dismiss(tid), ms);
  }, [dismiss]);
  const toast = { success: (m) => push(m, 'success'), error: (m) => push(m, 'error', 4500), info: (m) => push(m, 'info') };
  const Icon = { success: CheckCircle2, error: AlertTriangle, info: Info };
  const bg = { success: 'bg-lime', error: 'bg-pink text-white', info: 'bg-sky' };
  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[120] flex flex-col items-center gap-2 px-4 md:bottom-6 md:items-end md:pr-6" role="status" aria-live="polite">
        <AnimatePresence>
          {toasts.map((t) => {
            const I = Icon[t.type];
            return (
              <motion.div key={t.id} initial={{ opacity: 0, y: 30, scale: 0.9, rotate: -2 }} animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }} exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className={`pointer-events-auto flex max-w-sm items-center gap-3 rounded-2xl border-[3px] border-ink px-4 py-3 text-sm font-bold shadow-[4px_4px_0_#1c0a3d] ${bg[t.type]}`}>
                <I className="h-5 w-5 shrink-0" />
                <span className="flex-1">{t.message}</span>
                <button onClick={() => dismiss(t.id)} aria-label="Dismiss" className="opacity-70 hover:opacity-100"><X className="h-4 w-4" /></button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}
export const useToast = () => useContext(ToastCtx);
