import { useState } from 'react';
import { PageHeader, Panel, Stat } from './ui';
import { RevenueArea, CountBars, BreakdownBars } from './charts';
import { PageSpinner } from '../../components/ui/Spinner';
import { useFetch } from '../../hooks/useFetch';
import { qs } from '../../services/api';
import { inr } from '../../utils/format';

const RANGES = [['today', 'Today'], ['7d', '7 days'], ['30d', '30 days'], ['90d', '90 days'], ['custom', 'Custom']];

export default function Analytics() {
  const [range, setRange] = useState('30d');
  const [custom, setCustom] = useState({ from: '', to: '' });
  const ready = range !== 'custom' || custom.from;
  const { data, loading, error } = useFetch(ready ? `/admin/analytics${qs({ range, ...(range === 'custom' ? custom : {}) })}` : null, { ttl: 0 });
  const k = data?.kpis;
  const pctOrDash = (v) => (v === null || v === undefined ? '—' : `${v}%`);
  return (
    <div className="space-y-6">
      <PageHeader title="ANALYTICS" sub="All times IST. Revenue = confirmed → delivered orders.">
        <div className="flex rounded-full border-[3px] border-ink bg-white p-1" role="group" aria-label="Date range">
          {RANGES.map(([v, l]) => <button key={v} onClick={() => setRange(v)} aria-pressed={range === v} className={`rounded-full px-3 py-1.5 text-xs font-extrabold uppercase ${range === v ? 'bg-ink text-white' : ''}`}>{l}</button>)}
        </div>
        {range === 'custom' && (
          <div className="flex items-center gap-2">
            <input type="date" aria-label="From" className="input py-2 text-sm" value={custom.from} onChange={(e) => setCustom({ ...custom, from: e.target.value })} />
            <input type="date" aria-label="To" className="input py-2 text-sm" value={custom.to} onChange={(e) => setCustom({ ...custom, to: e.target.value })} />
          </div>
        )}
      </PageHeader>
      {error && <p className="font-bold text-magenta">{error.message}</p>}
      {!ready && <p className="font-bold text-muted">Pick a start date.</p>}
      {loading && !data && <PageSpinner />}
      {k && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <Stat label="Revenue" value={inr(k.revenue)} hint={k.revenueChange === null ? 'no prior-period data' : `${k.revenueChange >= 0 ? '▲' : '▼'} ${Math.abs(k.revenueChange)}% vs previous period`} tone="bg-lime" />
            <Stat label="Orders" value={k.orders} />
            <Stat label="Avg order value" value={inr(k.aov)} />
            <Stat label="New customers" value={k.newCustomers} hint={`${k.buyers} buyers`} />
            <Stat label="Repeat buyers" value={`${k.repeatBuyerRate}%`} />
            <Stat label="Online payment success" value={pctOrDash(k.paymentSuccessRate)} hint="paid ÷ payment attempts" />
            <Stat label="Abandoned checkouts" value={k.abandonedCheckouts} hint="online orders never paid" />
            <Stat label="Cancellations" value={k.cancellations} />
            <Stat label="Refunds" value={k.refunds} />
            <Stat label="Coupon orders" value={k.couponOrders} hint={`${inr(k.discountGiven)} discount given`} />
            <Stat label="COD share" value={`${k.codShare}%`} />
          </div>
          <div className="grid gap-6 xl:grid-cols-2">
            <Panel title="Revenue"><RevenueArea data={data.series} /></Panel>
            <Panel title="Orders"><CountBars data={data.series} /></Panel>
          </div>
          <div className="grid gap-6 xl:grid-cols-3">
            <Panel title="New customers"><CountBars data={data.series} dataKey="customers" name="New customers" color="#C2105A" /></Panel>
            <Panel title="Top products (revenue)" className="xl:col-span-1">{data.topProducts.length ? <BreakdownBars data={data.topProducts} /> : <p className="text-sm text-muted">No sales in range.</p>}</Panel>
            <Panel title="Top flavours (pops)">{data.topFlavours.length ? <BreakdownBars data={data.topFlavours} valueKey="pops" money={false} byFlavour /> : <p className="text-sm text-muted">No sales in range.</p>}</Panel>
          </div>
          <Panel title="Top products — table">
            <table className="w-full text-sm"><thead className="text-left text-[11px] uppercase text-muted"><tr><th className="py-2">Product</th><th className="py-2 text-right">Pops</th><th className="py-2 text-right">Revenue</th></tr></thead>
              <tbody>{data.topProducts.map((p) => <tr key={p.key} className="border-t border-ink/10"><td className="py-2 font-bold">{p.name}</td><td className="py-2 text-right">{p.pops}</td><td className="py-2 text-right font-bold">{inr(p.revenue)}</td></tr>)}</tbody></table>
          </Panel>
        </>
      )}
    </div>
  );
}
