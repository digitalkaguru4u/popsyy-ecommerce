import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { LayoutGrid, List, Search, SlidersHorizontal, X } from 'lucide-react';
import Seo from '../components/ui/Seo';
import ProductCard from '../components/product/ProductCard';
import { CardSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import { useFetch } from '../hooks/useFetch';
import useDebounce from '../hooks/useDebounce';
import { qs } from '../services/api';
import { useSettings } from '../context/SettingsContext';
import { titleCase } from '../utils/format';

const FLAVOURS = [['lemon-lime', 'Lemon Lime', '#D7FF3A'], ['orange', 'Orange', '#FF8A00'], ['cranberry', 'Cranberry', '#FF2E93'], ['kala-khatta', 'Kala Khatta', '#9B4DFF']];
const SORTS = [['featured', 'Featured'], ['popular', 'Popular'], ['price-asc', 'Price: low → high'], ['price-desc', 'Price: high → low'], ['newest', 'Newest'], ['rating', 'Top rated']];
const PACKS = [6, 12, 24];
const PRICES = [['', '', 'Any price'], ['', '250', 'Under ₹250'], ['250', '500', '₹250 – ₹500'], ['500', '', '₹500+']];

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const { settings } = useSettings();
  const [drawer, setDrawer] = useState(false);
  const [view, setView] = useState(() => { try { return localStorage.getItem('popsyy_view') || 'grid'; } catch { return 'grid'; } });
  const [search, setSearch] = useState(params.get('search') || '');
  const dSearch = useDebounce(search, 300);
  const get = (k) => params.get(k) || '';
  const list = (k) => (get(k) ? get(k).split(',') : []);

  const set = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => { if (v === '' || v === undefined || v === null || (Array.isArray(v) && !v.length)) next.delete(k); else next.set(k, Array.isArray(v) ? v.join(',') : v); });
    if (!('page' in patch)) next.delete('page');
    setParams(next, { replace: true });
  };
  useEffect(() => { if (dSearch !== get('search')) set({ search: dSearch }); }, [dSearch]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { try { localStorage.setItem('popsyy_view', view); } catch { /* ignore */ } }, [view]);

  const query = useMemo(() => qs({
    search: get('search'), flavour: get('flavour'), mood: get('mood'), packSize: get('packSize'), minPrice: get('minPrice'), maxPrice: get('maxPrice'),
    inStock: get('inStock'), bestseller: get('bestseller'), new: get('new'), minRating: get('minRating'), sort: get('sort') || 'featured', page: get('page') || 1, limit: 12,
  }), [params]); // eslint-disable-line react-hooks/exhaustive-deps
  const { data, loading } = useFetch(`/products${query}`, { ttl: 15000 });
  const products = data?.products || [];
  const activeCount = ['flavour', 'mood', 'packSize', 'minPrice', 'maxPrice', 'inStock', 'bestseller', 'new', 'minRating'].filter((k) => get(k)).length;
  const moodTitle = settings?.moods?.find((m) => m.key === get('mood'))?.title;

  const toggleIn = (k, v) => { const cur = list(k); set({ [k]: cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v] }); };

  const Filters = (
    <div className="space-y-7">
      <FilterGroup title="Flavour">
        <div className="flex flex-wrap gap-2">
          {FLAVOURS.map(([k, label, color]) => (
            <button key={k} onClick={() => toggleIn('flavour', k)} aria-pressed={list('flavour').includes(k)} className={`chip py-2 transition ${list('flavour').includes(k) ? 'bg-ink text-white' : 'hover:bg-lemon'}`}>
              <span className="h-3 w-3 rounded-full border-2 border-ink" style={{ background: color }} />{label}
            </button>
          ))}
        </div>
      </FilterGroup>
      {settings?.moods?.length > 0 && (
        <FilterGroup title="Mood">
          <div className="flex flex-wrap gap-2">
            {settings.moods.map((m) => <button key={m.key} onClick={() => set({ mood: get('mood') === m.key ? '' : m.key })} aria-pressed={get('mood') === m.key} className={`chip py-2 ${get('mood') === m.key ? 'bg-ink text-white' : 'hover:bg-lemon'}`}>{m.emoji} {titleCase(m.title.toLowerCase())}</button>)}
          </div>
        </FilterGroup>
      )}
      <FilterGroup title="Price">
        <div className="grid grid-cols-2 gap-2">
          {PRICES.map(([min, max, label]) => {
            const on = get('minPrice') === min && get('maxPrice') === max;
            return <button key={label} onClick={() => set({ minPrice: min, maxPrice: max })} aria-pressed={on} className={`rounded-xl border-[3px] border-ink px-2 py-2 text-xs font-extrabold ${on ? 'bg-lime' : 'bg-white hover:bg-lemon'}`}>{label}</button>;
          })}
        </div>
      </FilterGroup>
      <FilterGroup title="Pack size">
        <div className="flex gap-2">
          {PACKS.map((n) => <button key={n} onClick={() => toggleIn('packSize', String(n))} aria-pressed={list('packSize').includes(String(n))} className={`grid h-14 w-14 place-items-center rounded-2xl border-[3px] border-ink font-display text-lg font-extrabold ${list('packSize').includes(String(n)) ? 'bg-lime' : 'bg-white hover:bg-lemon'}`}>{n}</button>)}
        </div>
      </FilterGroup>
      <FilterGroup title="Show only">
        <div className="space-y-2">
          <Check label="In stock" on={get('inStock') === 'true'} onChange={(v) => set({ inStock: v ? 'true' : '' })} />
          <Check label="🔥 Bestsellers" on={get('bestseller') === 'true'} onChange={(v) => set({ bestseller: v ? 'true' : '' })} />
          <Check label="✨ New drops" on={get('new') === 'true'} onChange={(v) => set({ new: v ? 'true' : '' })} />
          <Check label="★ 4 & up" on={get('minRating') === '4'} onChange={(v) => set({ minRating: v ? '4' : '' })} />
        </div>
      </FilterGroup>
      {activeCount > 0 && <button onClick={() => setParams({}, { replace: true })} className="btn btn-sm btn-light w-full">Clear all filters</button>}
    </div>
  );

  const page = Number(get('page') || 1);
  return (
    <div className="container-pop pb-16 pt-6">
      <Seo title={moodTitle ? `${moodTitle} mood pops` : 'Shop all ice pops'} description="Shop POPSYY real-fruit ice pops: Lemon Lime, Orange, Cranberry and Kala Khatta in packs of 6, 12 and 24." path="/shop" />
      <div className="relative overflow-hidden rounded-[2rem] border-[3px] border-ink bg-gradient-to-r from-purple via-pink to-orange px-6 py-10 text-white shadow-[6px_6px_0_#1c0a3d] md:px-10 md:py-14">
        <div aria-hidden className="grain absolute inset-0" />
        <h1 className="display relative text-6xl md:text-8xl" style={{ textShadow: '4px 4px 0 #1c0a3d' }}>{moodTitle ? `${moodTitle} MODE` : 'ALL POPS'}</h1>
        <p className="hand relative mt-2 text-3xl text-lemon">boring flavours? hard pass.</p>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search pops…" aria-label="Search pops" className="input rounded-full pl-12" />
        </div>
        <button onClick={() => setDrawer(true)} className="btn btn-light lg:hidden"><SlidersHorizontal className="h-4 w-4" /> Filters{activeCount ? ` (${activeCount})` : ''}</button>
        <select value={get('sort') || 'featured'} onChange={(e) => set({ sort: e.target.value })} aria-label="Sort by" className="input w-auto rounded-full pr-10 font-bold">
          {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <div className="flex rounded-full border-[3px] border-ink bg-white p-1" role="group" aria-label="View">
          <button onClick={() => setView('grid')} aria-pressed={view === 'grid'} aria-label="Grid view" className={`grid h-9 w-9 place-items-center rounded-full ${view === 'grid' ? 'bg-ink text-white' : ''}`}><LayoutGrid className="h-4 w-4" /></button>
          <button onClick={() => setView('list')} aria-pressed={view === 'list'} aria-label="List view" className={`grid h-9 w-9 place-items-center rounded-full ${view === 'list' ? 'bg-ink text-white' : ''}`}><List className="h-4 w-4" /></button>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block"><div className="sticky top-28 rounded-[1.75rem] border-[3px] border-ink bg-white p-5">{Filters}</div></aside>
        <div>
          <p className="mb-4 text-sm font-bold text-muted" aria-live="polite">{loading ? 'Loading pops…' : `${data?.total ?? 0} pop${data?.total === 1 ? '' : 's'} found`}</p>
          {loading && !data ? (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((i) => <CardSkeleton key={i} />)}</div>
          ) : products.length === 0 ? (
            <EmptyState title="NO POPS MATCH." text="Loosen those filters a little." cta="Clear filters" to="/shop" />
          ) : view === 'grid' ? (
            <div className={`grid gap-6 sm:grid-cols-2 xl:grid-cols-3 ${loading ? 'opacity-60' : ''}`}>{products.map((p, i) => <ProductCard key={p._id} product={p} index={i} tilt={[-1, 1, -0.5][i % 3]} />)}</div>
          ) : (
            <div className="space-y-4">{products.map((p) => <ProductCard key={p._id} product={p} layout="list" />)}</div>
          )}
          {data?.pages > 1 && (
            <nav className="mt-10 flex justify-center gap-2" aria-label="Pagination">
              {Array.from({ length: data.pages }).map((_, i) => (
                <button key={i} onClick={() => { set({ page: i + 1 }); window.scrollTo({ top: 0, behavior: 'smooth' }); }} aria-current={page === i + 1 ? 'page' : undefined} className={`grid h-11 w-11 place-items-center rounded-full border-[3px] border-ink font-display font-extrabold ${page === i + 1 ? 'bg-ink text-white' : 'bg-white hover:bg-lemon'}`}>{i + 1}</button>
              ))}
            </nav>
          )}
        </div>
      </div>

      <AnimatePresence>
        {drawer && (
          <motion.div className="fixed inset-0 z-[95] bg-ink/50 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDrawer(false)}>
            <motion.div role="dialog" aria-label="Filters" onClick={(e) => e.stopPropagation()} initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 300, damping: 32 }}
              className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-[2rem] border-t-[3px] border-ink bg-paper p-5">
              <div className="mb-5 flex items-center justify-between"><h2 className="display text-3xl text-grape">Filters</h2><button onClick={() => setDrawer(false)} aria-label="Close filters" className="grid h-10 w-10 place-items-center rounded-full border-[3px] border-ink bg-white"><X className="h-5 w-5" /></button></div>
              {Filters}
              <button onClick={() => setDrawer(false)} className="btn btn-primary mt-6 w-full">Show {data?.total ?? 0} pops</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FilterGroup({ title, children }) {
  return <div><h3 className="mb-3 font-display text-sm font-extrabold uppercase tracking-widest text-grape">{title}</h3>{children}</div>;
}
function Check({ label, on, onChange }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 font-bold">
      <input type="checkbox" checked={on} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span className="grid h-6 w-6 place-items-center rounded-lg border-[3px] border-ink bg-white text-xs peer-checked:bg-lime peer-focus-visible:ring-4 peer-focus-visible:ring-purple/30">{on ? '✓' : ''}</span>{label}
    </label>
  );
}
