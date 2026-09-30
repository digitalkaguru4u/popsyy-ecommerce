import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader, SearchBox, Table, Pager, StatusPill, PayPill } from './ui';
import { useFetch } from '../../hooks/useFetch';
import useDebounce from '../../hooks/useDebounce';
import { qs } from '../../services/api';
import { STATUS_LABEL, PAYMENT_LABEL, fmtDateTime, inr } from '../../utils/format';

export default function Orders() {
  const [f, setF] = useState({ search: '', status: '', paymentStatus: '', paymentMethod: '', from: '', to: '' });
  const [page, setPage] = useState(1);
  const ds = useDebounce(f.search);
  const { data, loading } = useFetch(`/admin/orders${qs({ ...f, search: ds, page })}`, { ttl: 0 });
  const set = (patch) => { setF({ ...f, ...patch }); setPage(1); };
  return (
    <div>
      <PageHeader title="ORDERS" sub={`${data?.total ?? '…'} orders`}>
        <SearchBox value={f.search} onChange={(v) => set({ search: v })} placeholder="Order #, name, email, phone" />
      </PageHeader>
      <div className="mb-4 flex flex-wrap gap-2">
        <select className="input w-auto py-2 text-sm" aria-label="Status" value={f.status} onChange={(e) => set({ status: e.target.value })}><option value="">All statuses</option>{Object.entries(STATUS_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
        <select className="input w-auto py-2 text-sm" aria-label="Payment status" value={f.paymentStatus} onChange={(e) => set({ paymentStatus: e.target.value })}><option value="">All payments</option>{Object.entries(PAYMENT_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
        <select className="input w-auto py-2 text-sm" aria-label="Payment method" value={f.paymentMethod} onChange={(e) => set({ paymentMethod: e.target.value })}><option value="">Online + COD</option><option value="razorpay">Online</option><option value="cod">COD</option></select>
        <input type="date" aria-label="From date" className="input w-auto py-2 text-sm" value={f.from} onChange={(e) => set({ from: e.target.value })} />
        <input type="date" aria-label="To date" className="input w-auto py-2 text-sm" value={f.to} onChange={(e) => set({ to: e.target.value })} />
      </div>
      <Table head={['Order', 'Date', 'Customer', 'Items', 'Total', 'Payment', 'Status']} empty={data && !data.orders.length ? (loading ? 'Loading…' : 'No orders match.') : null}>
        {data?.orders.map((o) => (
          <tr key={o._id} className="hover:bg-cream/60">
            <td className="px-4 py-3"><Link to={`/admin/orders/${o._id}`} className="font-extrabold hover:underline">{o.orderNumber}</Link></td>
            <td className="px-4 py-3 text-xs">{fmtDateTime(o.createdAt)}</td>
            <td className="px-4 py-3"><p className="font-bold">{o.customerName}</p><p className="text-xs text-muted">{o.email}</p></td>
            <td className="px-4 py-3">{o.itemCount}</td>
            <td className="px-4 py-3 font-bold">{inr(o.total)}</td>
            <td className="px-4 py-3"><p className="mb-1 text-[11px] font-bold uppercase text-muted">{o.paymentMethod === 'cod' ? 'COD' : 'Online'}</p><PayPill status={o.paymentStatus} /></td>
            <td className="px-4 py-3"><StatusPill status={o.status} /></td>
          </tr>
        ))}
      </Table>
      <Pager page={page} pages={data?.pages} onPage={setPage} />
    </div>
  );
}
