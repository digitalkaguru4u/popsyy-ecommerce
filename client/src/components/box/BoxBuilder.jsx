import { useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Minus, Plus, Shuffle, RotateCcw, PackageOpen } from 'lucide-react';
import { useFetch } from '../../hooks/useFetch';
import { useSettings } from '../../context/SettingsContext';
import { useCart } from '../../context/CartContext';
import { colorsFor, gradient, inr, pct } from '../../utils/format';
import PopArt from '../product/PopArt';
import ProductImage from '../product/ProductImage';
import Skeleton from '../ui/Skeleton';

const FALLBACK_BOXES = [
  { size: 6, price: 199, mrp: 240, label: 'Snack Attack' },
  { size: 12, price: 379, mrp: 480, label: 'Squad Box' },
  { size: 24, price: 699, mrp: 960, label: 'Freezer Takeover' },
];

export default function BoxBuilder({ dark = false }) {
  const { settings } = useSettings();
  const { addBox, busy } = useCart();
  const { data, loading } = useFetch('/products/flavours');
  const boxes = settings?.boxes?.length ? settings.boxes : FALLBACK_BOXES;
  const [size, setSize] = useState(12);
  const [counts, setCounts] = useState({});
  const btnRef = useRef(null);
  const products = (data?.products || []).filter((p) => p.stock > 0);
  const box = boxes.find((b) => b.size === size) || boxes[0];
  const picked = Object.values(counts).reduce((a, n) => a + n, 0);
  const left = size - picked;

  const slots = useMemo(() => {
    const arr = [];
    products.forEach((p) => { for (let i = 0; i < (counts[p._id] || 0); i++) arr.push(p); });
    return arr;
  }, [counts, products]);

  const setQty = (p, n) => setCounts((c) => {
    const others = picked - (c[p._id] || 0);
    const clamped = Math.max(0, Math.min(n, size - others, p.stock));
    return { ...c, [p._id]: clamped };
  });
  const changeSize = (s) => {
    setSize(s);
    // trim selection if the new box is smaller
    setCounts((c) => {
      let over = Object.values(c).reduce((a, n) => a + n, 0) - s;
      if (over <= 0) return c;
      const next = { ...c };
      for (const k of Object.keys(next).reverse()) { const cut = Math.min(next[k], over); next[k] -= cut; over -= cut; if (!over) break; }
      return next;
    });
  };
  const autoFill = () => {
    if (!products.length) return;
    const next = { ...counts };
    let remaining = size - picked;
    let i = Math.floor(Math.random() * products.length);
    let guard = 0;
    while (remaining > 0 && guard < 500) {
      const p = products[i % products.length];
      if ((next[p._id] || 0) < p.stock) { next[p._id] = (next[p._id] || 0) + 1; remaining--; }
      i++; guard++;
    }
    setCounts(next);
  };
  const add = async () => {
    const selections = Object.entries(counts).filter(([, n]) => n > 0).map(([productId, qty]) => ({ productId, qty }));
    try { await addBox(size, selections, btnRef.current); setCounts({}); } catch { /* toast shown */ }
  };

  const text = dark ? 'text-white' : 'text-ink';
  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr] lg:gap-10">
      <div>
        <p className={`label ${dark ? 'text-lime' : ''}`}>Step 1 · Pick a box</p>
        <div className="grid grid-cols-3 gap-2 sm:gap-3" role="radiogroup" aria-label="Box size">
          {boxes.map((b) => (
            <button key={b.size} role="radio" aria-checked={size === b.size} onClick={() => changeSize(b.size)}
              className={`relative rounded-2xl border-[3px] border-ink p-3 text-left transition sm:p-4 ${size === b.size ? 'bg-lime shadow-[4px_4px_0_#1c0a3d] -translate-y-1' : 'bg-white hover:bg-lemon'}`}>
              <span className="block font-display text-3xl font-extrabold leading-none text-ink sm:text-4xl">{b.size}</span>
              <span className="block text-[11px] font-extrabold uppercase tracking-wide text-ink">pops</span>
              <span className="mt-2 block text-xs font-bold text-ink/70 sm:text-sm">{b.label}</span>
              <span className="mt-1 block font-display font-extrabold text-ink">{inr(b.price)}</span>
              <span className="block text-[11px] font-semibold text-ink/60">{inr(Math.round((b.price / b.size) * 10) / 10)}/pop</span>
              {pct(b.mrp, b.price) > 0 && <span className="absolute -right-2 -top-3 rotate-12 rounded-full border-2 border-ink bg-pink px-2 py-0.5 text-[10px] font-extrabold text-white">−{pct(b.mrp, b.price)}%</span>}
            </button>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <p className={`label mb-0 ${dark ? 'text-lime' : ''}`}>Step 2 · Mix your flavours</p>
          <div className="flex gap-2">
            <button onClick={autoFill} disabled={!left} className="btn btn-sm btn-light"><Shuffle className="h-3.5 w-3.5" /> Surprise me</button>
            <button onClick={() => setCounts({})} disabled={!picked} className="btn btn-sm btn-light" aria-label="Clear selection"><RotateCcw className="h-3.5 w-3.5" /></button>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {loading && [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-36" />)}
          {products.map((p) => {
            const c = colorsFor(p);
            const n = counts[p._id] || 0;
            return (
              <div key={p._id} className={`relative overflow-hidden rounded-2xl border-[3px] border-ink p-3 transition ${n ? 'shadow-[4px_4px_0_#1c0a3d]' : ''}`} style={{ background: gradient(c) }}>
                <ProductImage product={p} className="pointer-events-none absolute -right-3 -top-2 h-28 w-auto rotate-12 opacity-95" />
                <p className="relative font-display text-lg font-extrabold uppercase leading-none text-ink">{p.name}</p>
                <p className="relative mt-1 max-w-[60%] text-[11px] font-bold text-ink/70">{p.tagline}</p>
                <div className="relative mt-6 flex items-center justify-between rounded-full border-[3px] border-ink bg-white">
                  <button onClick={() => setQty(p, n - 1)} disabled={!n} aria-label={`Remove one ${p.name}`} className="grid h-9 w-9 place-items-center rounded-full disabled:opacity-30 active:scale-90"><Minus className="h-4 w-4" strokeWidth={3} /></button>
                  <motion.span key={n} initial={{ scale: 1.5 }} animate={{ scale: 1 }} className="font-display text-xl font-extrabold tabular-nums">{n}</motion.span>
                  <button onClick={() => setQty(p, n + 1)} disabled={!left || n >= p.stock} aria-label={`Add one ${p.name}`} className="grid h-9 w-9 place-items-center rounded-full bg-lime disabled:opacity-30 active:scale-90"><Plus className="h-4 w-4" strokeWidth={3} /></button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="lg:sticky lg:top-28 lg:self-start">
        <div className="sticker relative overflow-hidden bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="display flex items-center gap-2 text-2xl text-grape"><PackageOpen className="h-6 w-6" /> Your box</p>
            <p className="font-display text-lg font-extrabold" aria-live="polite"><span className={left ? 'text-pink' : 'text-leaf'}>{picked}</span> / {size} pops selected</p>
          </div>
          <div className="mt-2 h-3 overflow-hidden rounded-full border-2 border-ink bg-cream">
            <motion.div className="h-full bg-gradient-to-r from-pink via-orange to-lime" animate={{ width: `${(picked / size) * 100}%` }} transition={{ type: 'spring', stiffness: 120, damping: 18 }} />
          </div>
          <div className={`mt-4 grid gap-1.5 rounded-2xl border-[3px] border-dashed border-ink/30 bg-cream p-3 ${size === 24 ? 'grid-cols-8' : 'grid-cols-6'}`}>
            {Array.from({ length: size }).map((_, i) => {
              const p = slots[i];
              return (
                <div key={i} className="grid aspect-[3/5] place-items-center rounded-lg bg-white/70">
                  <AnimatePresence mode="popLayout">
                    {p && (
                      <motion.div key={p._id + i} initial={{ y: -30, scale: 0.4, rotate: -40, opacity: 0 }} animate={{ y: 0, scale: 1, rotate: 0, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={{ type: 'spring', stiffness: 420, damping: 18 }} className="h-full w-full p-0.5">
                        <PopArt color={colorsFor(p).from} color2={colorsFor(p).to} className="h-full w-full" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
          <div className="mt-4 space-y-1 text-sm font-semibold">
            {products.filter((p) => counts[p._id]).map((p) => (
              <div key={p._id} className="flex justify-between"><span>{p.name}</span><span>× {counts[p._id]}</span></div>
            ))}
            {!picked && <p className="text-muted">Tap + on a flavour to start filling your box.</p>}
          </div>
          <div className="mt-4 flex items-end justify-between border-t-2 border-dashed border-ink/20 pt-4">
            <div>
              <p className="text-xs font-extrabold uppercase text-muted">Box total</p>
              <p className="flex items-baseline gap-2"><span className="display text-4xl text-grape">{inr(box.price)}</span>{box.mrp > box.price && <span className="text-sm font-bold line-through opacity-50">{inr(box.mrp)}</span>}</p>
            </div>
            <button ref={btnRef} onClick={add} disabled={left !== 0 || busy} className="btn btn-primary btn-lg">
              {left ? `Add ${left} more` : 'Add box to cart'}
            </button>
          </div>
        </div>
        <p className={`mt-3 text-center text-xs font-semibold ${text} opacity-70`}>Mix any flavours. Ships frozen in a cold-chain box.</p>
      </div>
    </div>
  );
}
