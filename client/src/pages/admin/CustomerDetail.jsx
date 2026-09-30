import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PageHeader, Panel, Stat, StatusPill, PayPill } from './ui';
import { PageSpinner } from '../../components/ui/Spinner';
import { useFetch } from '../../hooks/useFetch';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { fmtDate, fmtDateTime, inr } from '../../utils/format';

export default function CustomerDetail() {
  const { id } = useParams();
  const toast = useToast();
  const { data, loading, reload } = useFetch(`/admin/customers/${id}`, { ttl: 0 });
  if (loading && !data) return <PageSpinner />;
  if (!data) return <p>Customer not found.</p>;
  const c = data.customer;
  const block = async () => {
    if (!window.confirm(c.isBlocked ? `Unblock ${c.name}?` : `Block ${c.name}? They won't be able to log in or order.`)) return;
    try { await api.put(`/admin/customers/${c._id}/block`, { blocked: !c.isBlocked }); toast.success(c.isBlocked ? 'Unblocked' : 'Blocked'); reload(); } catch (e) { toast.error(e.message); }
  };
  return (
    <div className="space-y-6">
      <Link to="/admin/customers" className="inline-flex items-center gap-1 text-sm font-extrabold uppercase"><ArrowLeft className="h-4 w-4" /> Customers</Link>
      <PageHeader title={c.name.toUpperCase()} sub={`${c.email} · ${c.phone || 'no phone'} · joined ${fmtDate(c.createdAt)}`}>
        {c.role !== 'admin' && <button onClick={block} className={`btn btn-sm ${c.isBlocked ? 'btn-lime' : 'btn-light text-magenta'}`}>{c.isBlocked ? 'Unblock account' : 'Block account'}</button>}
      </PageHeader>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Orders" value={data.orders.length} /><Stat label="Total spent" value={inr(data.spent)} tone="bg-lime" />
        <Stat label="Last login" value={c.lastLoginAt ? fmtDate(c.lastLoginAt) : '—'} /><Stat label="Marketing" value={c.marketingOptIn ? 'Opted in' : 'No'} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Panel title="Order history">
          <div className="divide-y divide-ink/10">{data.orders.map((o) => (
            <Link key={o._id} to={`/admin/orders/${o._id}`} className="flex flex-wrap items-center gap-3 py-3 text-sm hover:bg-cream"><span className="w-32 font-extrabold">{o.orderNumber}</span><span className="flex-1 text-xs text-muted">{fmtDateTime(o.createdAt)}</span><StatusPill status={o.status} /><PayPill status={o.paymentStatus} /><span className="w-20 text-right font-bold">{inr(o.total)}</span></Link>
          ))}{!data.orders.length && <p className="py-3 text-sm text-muted">No orders yet.</p>}</div>
        </Panel>
        <Panel title="Addresses">
          <div className="space-y-2">{data.addresses.map((a) => <div key={a._id} className="rounded-xl bg-cream p-3 text-sm"><b>{a.name}</b> · {a.phone}{a.isDefault && ' · default'}<br />{a.line1}, {a.city}, {a.state} {a.pincode}</div>)}{!data.addresses.length && <p className="text-sm text-muted">None saved.</p>}</div>
        </Panel>
      </div>
    </div>
  );
}
