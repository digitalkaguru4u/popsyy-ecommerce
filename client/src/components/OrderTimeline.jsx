import { motion } from 'framer-motion';
import { Check, Package, Truck, ClipboardCheck, PartyPopper, Box, XCircle } from 'lucide-react';
import { fmtDateTime } from '../utils/format';

const FLOW = [
  ['pending', 'Order placed', ClipboardCheck],
  ['confirmed', 'Confirmed', Check],
  ['packed', 'Packed', Box],
  ['shipped', 'Shipped', Truck],
  ['out_for_delivery', 'Out for delivery', Package],
  ['delivered', 'Delivered', PartyPopper],
];
const RANK = { pending: 0, confirmed: 1, processing: 1, packed: 2, shipped: 3, out_for_delivery: 4, delivered: 5 };

export default function OrderTimeline({ order }) {
  if (['cancelled', 'refunded'].includes(order.status)) {
    const h = [...(order.statusHistory || [])].reverse().find((x) => x.status === order.status);
    return (
      <div className="flex items-center gap-3 rounded-2xl border-[3px] border-ink bg-ink/5 p-4 font-bold">
        <XCircle className="h-6 w-6 text-magenta" /> Order {order.status}{h?.at ? ` · ${fmtDateTime(h.at)}` : ''}{h?.note ? ` — ${h.note}` : ''}
      </div>
    );
  }
  const current = RANK[order.status] ?? 0;
  const when = (status) => order.statusHistory?.find((h) => h.status === status || (status === 'confirmed' && h.status === 'processing'))?.at;
  return (
    <ol className="relative space-y-0" aria-label="Order progress">
      {FLOW.map(([key, label, Icon], i) => {
        const done = i <= current;
        const at = key === 'pending' ? order.createdAt : when(key);
        return (
          <li key={key} className="relative flex gap-4 pb-6 last:pb-0">
            {i < FLOW.length - 1 && <span className="absolute left-[21px] top-11 h-[calc(100%-2.5rem)] w-1 rounded bg-ink/10"><motion.span className="block w-full rounded bg-pink" initial={{ height: 0 }} animate={{ height: i < current ? '100%' : 0 }} transition={{ delay: i * 0.15, duration: 0.3 }} /></span>}
            <motion.span initial={{ scale: 0.6 }} animate={{ scale: 1 }} transition={{ delay: i * 0.15 }} className={`relative z-10 grid h-11 w-11 shrink-0 place-items-center rounded-full border-[3px] border-ink ${done ? (i === current ? 'bg-pink text-white shadow-[3px_3px_0_#1c0a3d]' : 'bg-lime') : 'bg-white text-ink/30'}`}><Icon className="h-5 w-5" /></motion.span>
            <div className="pt-2">
              <p className={`font-display text-lg font-extrabold uppercase leading-none ${done ? '' : 'opacity-40'}`}>{key === 'pending' && order.paymentMethod === 'razorpay' && order.paymentStatus !== 'paid' && current === 0 ? 'Awaiting payment' : label}</p>
              {done && at && <p className="mt-1 text-xs font-semibold text-muted">{fmtDateTime(at)}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
