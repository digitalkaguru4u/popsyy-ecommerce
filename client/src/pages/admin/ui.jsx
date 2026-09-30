import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { STATUS_COLOR, STATUS_LABEL, PAYMENT_LABEL } from '../../utils/format';

// Chart palette — validated (lightness band, contrast, adjacent CVD). Colour follows the flavour entity.
export const FLAVOUR_CHART = { 'lemon-lime': '#3E8E0B', 'kala-khatta': '#6A1FD0', orange: '#E85D04', cranberry: '#C2105A' };
export const SERIES = '#6A1FD0';

export function PageHeader({ title, sub, children }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div><h1 className="display text-4xl text-grape md:text-5xl">{title}</h1>{sub && <p className="mt-1 text-sm font-semibold text-muted">{sub}</p>}</div>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}
export function Panel({ title, action, children, className = '' }) {
  return (
    <section className={`rounded-3xl border-[3px] border-ink bg-white p-5 ${className}`}>
      {(title || action) && <div className="mb-4 flex items-center justify-between gap-2">{title && <h2 className="font-display text-lg font-extrabold uppercase text-grape">{title}</h2>}{action}</div>}
      {children}
    </section>
  );
}
export function Stat({ label, value, hint, tone = 'bg-white', icon: Icon }) {
  return (
    <div className={`rounded-3xl border-[3px] border-ink p-4 ${tone}`}>
      <p className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-ink/70">{Icon && <Icon className="h-3.5 w-3.5" />}{label}</p>
      <p className="mt-1 font-display text-3xl font-extrabold tabular-nums text-ink">{value}</p>
      {hint && <p className="mt-0.5 text-xs font-semibold text-ink/60">{hint}</p>}
    </div>
  );
}
export function SearchBox({ value, onChange, placeholder = 'Search…' }) {
  return (
    <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" /><input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} className="input w-64 max-w-full py-2 pl-9 text-sm" /></div>
  );
}
export function Pager({ page, pages, onPage }) {
  if (!pages || pages <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-end gap-2 text-sm font-bold">
      <button disabled={page <= 1} onClick={() => onPage(page - 1)} className="grid h-9 w-9 place-items-center rounded-full border-2 border-ink disabled:opacity-30" aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></button>
      <span>Page {page} / {pages}</span>
      <button disabled={page >= pages} onClick={() => onPage(page + 1)} className="grid h-9 w-9 place-items-center rounded-full border-2 border-ink disabled:opacity-30" aria-label="Next page"><ChevronRight className="h-4 w-4" /></button>
    </div>
  );
}
export const StatusPill = ({ status }) => <span className={`inline-block whitespace-nowrap rounded-full border-2 border-ink px-2 py-0.5 text-[11px] font-extrabold uppercase ${STATUS_COLOR[status] || 'bg-white'}`}>{STATUS_LABEL[status] || status}</span>;
export const PayPill = ({ status }) => <span className={`inline-block whitespace-nowrap rounded-full border-2 px-2 py-0.5 text-[11px] font-extrabold uppercase ${status === 'paid' || status === 'cod_collected' ? 'border-leaf bg-lime/40' : status === 'failed' ? 'border-magenta text-magenta' : 'border-ink/30'}`}>{PAYMENT_LABEL[status] || status}</span>;
export function Table({ head, children, empty }) {
  return (
    <div className="overflow-x-auto rounded-3xl border-[3px] border-ink bg-white">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="bg-cream text-[11px] font-extrabold uppercase tracking-wider text-grape"><tr>{head.map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-ink/10">{children}</tbody>
      </table>
      {empty && <p className="p-8 text-center font-bold text-muted">{empty}</p>}
    </div>
  );
}
export function Toggle({ checked, onChange, label }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-bold">
      <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className={`relative h-6 w-11 rounded-full border-2 border-ink transition ${checked ? 'bg-lime' : 'bg-ink/10'}`}><span className={`absolute top-0.5 h-4 w-4 rounded-full border-2 border-ink bg-white transition ${checked ? 'left-[22px]' : 'left-0.5'}`} /></button>
      {label}
    </label>
  );
}
export const ChartTip = ({ active, payload, label, money }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border-2 border-ink bg-white px-3 py-2 text-xs font-bold shadow-[3px_3px_0_#1c0a3d]">
      <p className="mb-1 text-ink/60">{label}</p>
      {payload.map((p) => <p key={p.dataKey} className="flex items-center gap-2 text-ink"><span className="h-2.5 w-2.5 rounded-full" style={{ background: p.color || p.payload?.fill }} />{p.name}: {money ? `₹${Number(p.value).toLocaleString('en-IN')}` : Number(p.value).toLocaleString('en-IN')}</p>)}
    </div>
  );
};
