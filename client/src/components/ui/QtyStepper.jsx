import { Minus, Plus } from 'lucide-react';
export default function QtyStepper({ value, onChange, min = 1, max = 50, size = 'md', disabled }) {
  const sz = size === 'sm' ? 'h-8 w-8' : 'h-11 w-11';
  return (
    <div className="inline-flex items-center rounded-full border-[3px] border-ink bg-white">
      <button type="button" aria-label="Decrease quantity" disabled={disabled || value <= min} onClick={() => onChange(value - 1)} className={`${sz} grid place-items-center rounded-full transition hover:bg-lemon active:scale-90 disabled:opacity-30`}><Minus className="h-4 w-4" strokeWidth={3} /></button>
      <span className="min-w-8 text-center font-display text-lg font-extrabold tabular-nums" aria-live="polite">{value}</span>
      <button type="button" aria-label="Increase quantity" disabled={disabled || value >= max} onClick={() => onChange(value + 1)} className={`${sz} grid place-items-center rounded-full transition hover:bg-lemon active:scale-90 disabled:opacity-30`}><Plus className="h-4 w-4" strokeWidth={3} /></button>
    </div>
  );
}
