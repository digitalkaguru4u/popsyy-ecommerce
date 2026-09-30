import { Link } from 'react-router-dom';
import { IndianRupee, ShoppingBag, Users, Package, AlertTriangle, Clock, CalendarDays, MessageSquare } from 'lucide-react';
import { PageHeader, Panel, Stat, StatusPill, PayPill } from './ui';
import { RevenueArea, CountBars, BreakdownBars } from './charts';
import { PageSpinner } from '../../components/ui/Spinner';
import { useFetch } from '../../hooks/useFetch';
import { fmtDateTime, inr } from '../../utils/format';

export default function Dashboard() {
  const { data, loading } = useFetch('/admin/dashboard', { ttl: 0 });
  if (loading && !data) return <PageSpinner />;
  if (!data) return <p>Couldn't load dashboard.</p>;
  const s = data.stats;
  return (
    <div className="space-y-6">
      <PageHeader title="DASHBOARD" sub="Revenue counts confirmed → delivered orders. Last 30 days charts, IST." />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Total revenue" value={inr(s.totalRevenue)} icon={IndianRupee} tone="bg-lime" />
        <Stat label="Today" value={inr(s.todayRevenue)} hint={`${s.todayOrders} orders`} icon={CalendarDays} tone="bg-lemon" />
        <Stat label="Orders" value={s.orders} hint={`AOV ${inr(s.aov)}`} icon={ShoppingBag} />
        <Stat label="Customers" value={s.customers} icon={Users} />
        <Stat label="Products" value={s.products} icon={Package} />
        <Stat label="Low stock" value={s.lowStock} icon={AlertTriangle} tone={s.lowStock ? 'bg-[#FFC2E2]' : 'bg-white'} />
        <Stat label="To fulfil" value={s.pendingOrders} hint={`${s.awaitingPayment} awaiting payment`} icon={Clock} tone={s.pendingOrders ? 'bg-sky' : 'bg-white'} />
        <Stat label="Reviews to check" value={s.pendingReviews} icon={MessageSquare} />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Revenue · last 30 days"><RevenueArea data={data.series} /></Panel>
        <Panel title="Orders · last 30 days"><CountBars data={data.series} /></Panel>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Sales by product (30d)">{data.salesByProduct.length ? <BreakdownBars data={data.salesByProduct} /> : <p className="text-sm text-muted">No sales yet.</p>}</Panel>
        <Panel title="Pops sold by flavour (30d)">{data.salesByFlavour.length ? <BreakdownBars data={data.salesByFlavour} valueKey="pops" money={false} byFlavour /> : <p className="text-sm text-muted">No sales yet.</p>}</Panel>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Panel title="Recent orders" action={<Link to="/admin/orders" className="text-xs font-extrabold uppercase underline">All orders</Link>}>
          <div className="divide-y divide-ink/10">
            {data.recentOrders.map((o) => (
              <Link key={o._id} to={`/admin/orders/${o._id}`} className="flex flex-wrap items-center gap-3 py-3 text-sm hover:bg-cream">
                <span className="w-32 font-extrabold">{o.orderNumber}</span><span className="min-w-0 flex-1 truncate">{o.customerName}</span>
                <StatusPill status={o.status} /><PayPill status={o.paymentStatus} /><span className="w-20 text-right font-bold">{inr(o.total)}</span>
                <span className="w-28 text-right text-xs text-muted">{fmtDateTime(o.createdAt)}</span>
              </Link>
            ))}
            {!data.recentOrders.length && <p className="py-4 text-sm text-muted">No orders yet.</p>}
          </div>
        </Panel>
        <Panel title="Low stock" action={<Link to="/admin/inventory" className="text-xs font-extrabold uppercase underline">Inventory</Link>}>
          {data.lowStockProducts.length === 0 ? <p className="text-sm font-bold text-leaf">All stocked up ✓</p> : (
            <ul className="space-y-2">{data.lowStockProducts.map((p) => <li key={p._id} className="flex items-center justify-between rounded-xl bg-cream px-3 py-2 text-sm font-bold"><span>{p.name}</span><span className={p.stock <= 0 ? 'text-magenta' : 'text-orange'}>{p.stock <= 0 ? 'OUT' : `${p.stock} pops`}</span></li>)}</ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
