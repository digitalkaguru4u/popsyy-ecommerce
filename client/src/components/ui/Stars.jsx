import { Star } from 'lucide-react';
export default function Stars({ value = 0, size = 16, className = '', showValue = false, count }) {
  return (
    <span className={`inline-flex items-center gap-1 ${className}`} aria-label={`Rated ${value} out of 5`}>
      <span className="inline-flex">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} width={size} height={size} strokeWidth={2} className={i <= Math.round(value) ? 'fill-lemon text-ink' : 'fill-transparent text-ink/30'} />
        ))}
      </span>
      {showValue && <span className="text-sm font-extrabold">{Number(value).toFixed(1)}</span>}
      {count !== undefined && <span className="text-xs font-semibold opacity-70">({count})</span>}
    </span>
  );
}
