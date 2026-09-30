import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import EmptyState from '../../components/ui/EmptyState';
import Skeleton from '../../components/ui/Skeleton';
import PopArt from '../../components/product/PopArt';
import { useFetch } from '../../hooks/useFetch';
import { STATUS_COLOR, STATUS_LABEL, PAYMENT_LABEL, fmtDate, inr, FLAVOUR_COLORS } from '../../utils/format';

export default function Orders() {
  const [page, setPage] = useState(1);
  const { data, loading } = useFetch(`/orders?page=${page}`, { ttl: 0 });
  if (loading && !data) return <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-28" />)}</div>;
  if (!data?.orders?.length) return <EmptyState title="NO ORDERS YET." text="Your first box is one click away." />;
  return (
    <div className="space-y-4">
      {data.orders.map((o) => (
        <Link key={o._id} to={`/account/orders/${o._id}`} className="sticker group flex flex-wrap items-center gap-4 bg-white p-5 transition hover:-translate-y-1">
          <div className="flex -space-x-3">{o.items.slice(0, 3).map((it) => { const c = FLAVOUR_COLORS[it.flavour] || { from: '#FF2E93', to: '#FF8A00' }; return <PopArt key={it._id} color={c.from} color2={c.to} className="h-14 w-8" />; })}</div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-xl font-extrabold">{o.orderNumber}</p>
            <p className="text-sm text-muted">{fmtDate(o.createdAt)} · {o.itemCount} item{o.itemCount === 1 ? '' : 's'} · {inr(o.total)}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`chip ${STATUS_COLOR[o.status]}`}>{STATUS_LABEL[o.status]}</span>
            <span className="chip">{PAYMENT_LABEL[o.paymentStatus]}</span>
            <ChevronRight className="h-5 w-5 transition group-hover:translate-x-1" />
          </div>
        </Link>
      ))}
      {data.pages > 1 && <div className="flex gap-2"><button disabled={page <= 1} onClick={() => setPage(page - 1)} className="btn btn-sm btn-light">Prev</button><button disabled={page >= data.pages} onClick={() => setPage(page + 1)} className="btn btn-sm btn-light">Next</button></div>}
    </div>
  );
}
