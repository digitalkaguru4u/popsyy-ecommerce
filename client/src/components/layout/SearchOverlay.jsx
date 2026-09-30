import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { api, qs } from '../../services/api';
import useDebounce from '../../hooks/useDebounce';
import ProductImage from '../product/ProductImage';
import { colorsFor, gradient, inr } from '../../utils/format';

export default function SearchOverlay({ open, onClose }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const dq = useDebounce(q, 220);
  const input = useRef(null);
  const nav = useNavigate();

  useEffect(() => { if (open) setTimeout(() => input.current?.focus(), 50); else setQ(''); }, [open]);
  useEffect(() => {
    if (!open) return undefined;
    const h = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [open, onClose]);
  useEffect(() => {
    let live = true;
    api.get(`/products${qs({ search: dq, limit: 6 })}`).then((r) => live && setResults(r.products)).catch(() => {});
    return () => { live = false; };
  }, [dq]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[100] bg-ink/70 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div initial={{ y: -40 }} animate={{ y: 0 }} exit={{ y: -40 }} onClick={(e) => e.stopPropagation()} className="container-pop pt-4">
            <form onSubmit={(e) => { e.preventDefault(); nav(`/shop${qs({ search: q })}`); onClose(); }} className="flex items-center gap-3 rounded-full border-[3px] border-ink bg-white p-2 pl-5 shadow-[6px_6px_0_#1c0a3d]" role="search">
              <Search className="h-6 w-6 shrink-0" />
              <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search flavours… try “kala”" aria-label="Search products" className="w-full bg-transparent py-2 font-display text-xl font-extrabold outline-none placeholder:text-ink/30 md:text-2xl" />
              <button type="button" onClick={onClose} aria-label="Close search" className="grid h-11 w-11 shrink-0 place-items-center rounded-full border-[3px] border-ink bg-lemon"><X /></button>
            </form>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((p) => (
                <Link key={p._id} to={`/product/${p.slug}`} onClick={onClose} className="flex items-center gap-4 rounded-3xl border-[3px] border-ink bg-white p-3 transition hover:-translate-y-1 hover:shadow-[5px_5px_0_#1c0a3d]">
                  <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl" style={{ background: gradient(colorsFor(p)) }}><ProductImage product={p} className="h-14 w-auto" /></div>
                  <div><div className="display text-xl text-grape">{p.name}</div><div className="text-sm font-bold">{inr(p.price)} <span className="font-medium text-muted">· {p.tagline}</span></div></div>
                </Link>
              ))}
              {dq && !results.length && <p className="rounded-3xl bg-white p-6 font-bold">No pops match “{dq}”. Try lemon, orange, cranberry or kala khatta.</p>}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
