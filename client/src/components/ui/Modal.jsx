import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, children, wide = false, dismissable = true }) {
  useEffect(() => {
    if (!open) return undefined;
    const h = (e) => { if (e.key === 'Escape' && dismissable) onClose?.(); };
    document.addEventListener('keydown', h);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', h); document.body.style.overflow = prev; };
  }, [open, onClose, dismissable]);
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[110] flex items-end justify-center bg-ink/60 p-0 backdrop-blur-sm sm:items-center sm:p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => dismissable && onClose?.()}>
          <motion.div role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}
            initial={{ y: 60, scale: 0.96, rotate: -1 }} animate={{ y: 0, scale: 1, rotate: 0 }} exit={{ y: 40, opacity: 0 }} transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            className={`max-h-[92vh] w-full overflow-y-auto rounded-t-[2rem] border-[3px] border-ink bg-paper p-5 shadow-[8px_8px_0_#1c0a3d] sm:rounded-[2rem] sm:p-7 ${wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'}`}>
            <div className="mb-4 flex items-start justify-between gap-4">
              {title && <h2 className="display text-2xl text-grape sm:text-3xl">{title}</h2>}
              {dismissable && <button onClick={onClose} aria-label="Close" className="grid h-10 w-10 shrink-0 place-items-center rounded-full border-[3px] border-ink bg-white hover:bg-lemon"><X className="h-5 w-5" /></button>}
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
