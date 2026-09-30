import { Copy } from 'lucide-react';
import Skeleton from '../../components/ui/Skeleton';
import { useFetch } from '../../hooks/useFetch';
import { useToast } from '../../context/ToastContext';
import { fmtDate, inr } from '../../utils/format';

const BG = ['bg-lime', 'bg-lemon', 'bg-sky', 'bg-[#FFC2E2]'];
export default function Coupons() {
  const toast = useToast();
  const { data, loading } = useFetch('/account/coupons', { ttl: 0 });
  if (loading && !data) return <Skeleton className="h-40" />;
  if (!data?.coupons?.length) return <p className="rounded-2xl border-[3px] border-dashed border-ink/30 p-8 text-center font-bold text-muted">No coupons right now. Join the Pop Club for drops.</p>;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {data.coupons.map((c, i) => (
        <div key={c.code} className={`sticker relative overflow-hidden p-5 ${BG[i % 4]} ${c.usable ? '' : 'opacity-50'}`}>
          <span aria-hidden className="absolute -left-4 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full border-[3px] border-ink bg-paper" />
          <span aria-hidden className="absolute -right-4 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full border-[3px] border-ink bg-paper" />
          <p className="display text-4xl">{c.discountType === 'percentage' ? `${c.value}% OFF` : `${inr(c.value)} OFF`}</p>
          <p className="mt-1 font-semibold">{c.description}</p>
          <p className="mt-1 text-xs font-bold text-ink/70">{c.minOrder ? `Min order ${inr(c.minOrder)}` : 'No minimum'}{c.maxDiscount ? ` · up to ${inr(c.maxDiscount)}` : ''}{c.expiresAt ? ` · till ${fmtDate(c.expiresAt)}` : ''}</p>
          <button disabled={!c.usable} onClick={() => { navigator.clipboard?.writeText(c.code); toast.success(`${c.code} copied`); }} className="mt-4 inline-flex items-center gap-2 rounded-full border-[3px] border-dashed border-ink bg-white px-4 py-2 font-display font-extrabold tracking-widest">{c.code} <Copy className="h-4 w-4" /></button>
          {!c.usable && <p className="mt-2 text-xs font-bold">Already used</p>}
        </div>
      ))}
    </div>
  );
}
