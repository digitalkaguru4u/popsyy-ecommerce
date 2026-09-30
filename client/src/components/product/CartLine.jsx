import { Link } from 'react-router-dom';
import { Trash2, AlertTriangle } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import QtyStepper from '../ui/QtyStepper';
import ProductImage from './ProductImage';
import PopArt from './PopArt';
import { colorsFor, gradient, inr } from '../../utils/format';

export default function CartLine({ line, compact = false }) {
  const { updateQty, remove, busy } = useCart();
  if (line.invalid) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-2xl border-[3px] border-dashed border-magenta bg-white p-3">
        <p className="text-sm font-bold text-magenta"><AlertTriangle className="mr-1 inline h-4 w-4" />{line.name}: {line.issue}</p>
        <button onClick={() => remove(line._id)} className="btn btn-sm btn-light">Remove</button>
      </div>
    );
  }
  const isBox = line.kind === 'box';
  const c = isBox ? { from: '#FF2E93', to: '#FF8A00' } : colorsFor(line.product);
  return (
    <div className="flex gap-3 rounded-2xl border-[3px] border-ink bg-white p-3">
      <div className={`relative grid shrink-0 place-items-center overflow-hidden rounded-xl border-2 border-ink ${compact ? 'h-20 w-16' : 'h-28 w-24'}`} style={{ background: gradient(c) }}>
        {isBox ? (
          <div className="flex -space-x-3">{line.box.selections.slice(0, 3).map((s) => <PopArt key={s.product._id} color={colorsFor(s.product).from} color2={colorsFor(s.product).to} className="h-12 w-7" />)}</div>
        ) : (
          <ProductImage product={line.product} className="h-[85%] w-auto" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            {isBox ? <p className="font-display text-lg font-extrabold leading-tight text-grape">{line.name}</p> : <Link to={`/product/${line.product.slug}`} className="font-display text-lg font-extrabold leading-tight text-grape hover:underline">{line.name}</Link>}
            <p className="text-xs font-semibold text-muted">{isBox ? line.box.selections.map((s) => `${s.qty}× ${s.product.name}`).join(' · ') : `${line.variant.name} · ${line.pops} pops`}</p>
          </div>
          <button onClick={() => remove(line._id)} disabled={busy} aria-label={`Remove ${line.name}`} className="grid h-8 w-8 shrink-0 place-items-center rounded-full hover:bg-pink hover:text-white"><Trash2 className="h-4 w-4" /></button>
        </div>
        {line.issue && <p className="mt-1 text-xs font-bold text-magenta">{line.issue}</p>}
        <div className="mt-2 flex items-center justify-between gap-2">
          <QtyStepper size="sm" value={line.qty} min={1} max={isBox ? 10 : Math.max(1, Math.min(50, line.maxQty ?? 50))} disabled={busy} onChange={(q) => updateQty(line._id, q)} />
          <div className="text-right"><div className="font-display text-lg font-extrabold">{inr(line.lineTotal)}</div>{line.mrpTotal > line.lineTotal && <div className="text-xs line-through opacity-50">{inr(line.mrpTotal)}</div>}</div>
        </div>
      </div>
    </div>
  );
}
