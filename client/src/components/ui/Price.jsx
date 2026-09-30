import { inr, pct } from '../../utils/format';
export default function Price({ price, mrp, size = 'md', className = '' }) {
  const off = pct(mrp, price);
  const s = { sm: 'text-base', md: 'text-xl', lg: 'text-3xl md:text-4xl' }[size];
  return (
    <span className={`inline-flex flex-wrap items-baseline gap-x-2 ${className}`}>
      <span className={`font-display font-extrabold ${s}`}>{inr(price)}</span>
      {off > 0 && <span className="text-sm font-semibold line-through opacity-60">{inr(mrp)}</span>}
      {off > 0 && <span className="rounded-full bg-lime px-2 py-0.5 text-[11px] font-extrabold uppercase text-ink">{off}% off</span>}
    </span>
  );
}
