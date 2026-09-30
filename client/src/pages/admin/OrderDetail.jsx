import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { PageHeader, Panel, StatusPill, PayPill } from './ui';
import Field from '../../components/ui/Field';
import Spinner, { PageSpinner } from '../../components/ui/Spinner';
import OrderTimeline from '../../components/OrderTimeline';
import { useFetch } from '../../hooks/useFetch';
import { api, apiUrl } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { STATUS_LABEL, fmtDateTime, inr } from '../../utils/format';

const NEXT = {
  pending: ['confirmed', 'cancelled'], confirmed: ['processing', 'packed', 'shipped', 'cancelled'], processing: ['packed', 'shipped', 'cancelled'], packed: ['shipped', 'cancelled'],
  shipped: ['out_for_delivery', 'delivered'], out_for_delivery: ['delivered'], delivered: ['refunded'], cancelled: [], refunded: [],
};

export default function OrderDetail() {
  const { id } = useParams();
  const toast = useToast();
  const { data, loading, reload } = useFetch(`/admin/orders/${id}`, { ttl: 0 });
  const [st, setSt] = useState({ status: '', note: '', carrier: '', awb: '', url: '' });
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  if (loading && !data) return <PageSpinner />;
  if (!data) return <p>Order not found.</p>;
  const o = data.order;
  let options = NEXT[o.status] || [];
  if (['paid', 'cod_collected'].includes(o.paymentStatus) && !options.includes('refunded') && !['cancelled', 'refunded'].includes(o.status)) options = [...options, 'refunded'];

  const updateStatus = async (e) => {
    e.preventDefault();
    if (!st.status) return;
    if (['cancelled', 'refunded'].includes(st.status) && !window.confirm(`Mark order as ${st.status}? ${o.paymentStatus === 'paid' ? 'This triggers a refund of ' + inr(o.total) + ' to the customer.' : ''}`)) return;
    setBusy(true);
    try {
      const tracking = st.status === 'shipped' && (st.carrier || st.awb || st.url) ? { carrier: st.carrier, awb: st.awb, url: st.url } : undefined;
      await api.put(`/admin/orders/${o._id}/status`, { status: st.status, note: st.note, tracking });
      toast.success(`Order → ${STATUS_LABEL[st.status]}`); setSt({ status: '', note: '', carrier: '', awb: '', url: '' }); reload();
    } catch (err) { toast.error(err.message); } finally { setBusy(false); }
  };
  const addNote = async (e) => { e.preventDefault(); if (!note.trim()) return; try { await api.post(`/admin/orders/${o._id}/notes`, { text: note }); setNote(''); reload(); } catch (err) { toast.error(err.message); } };

  return (
    <div className="space-y-6">
      <Link to="/admin/orders" className="inline-flex items-center gap-1 text-sm font-extrabold uppercase"><ArrowLeft className="h-4 w-4" /> Orders</Link>
      <PageHeader title={o.orderNumber} sub={`Placed ${fmtDateTime(o.createdAt)} · ${o.deliveryMethod} delivery`}>
        <StatusPill status={o.status} /><PayPill status={o.paymentStatus} />
        <a href={apiUrl(`/admin/orders/${o._id}/invoice`)} target="_blank" rel="noreferrer" className="btn btn-light btn-sm"><Printer className="h-4 w-4" /> Invoice</a>
      </PageHeader>
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Panel title="Items">
            <table className="w-full text-sm">
              <thead className="text-left text-[11px] uppercase text-muted"><tr><th className="py-2">Item</th><th>SKU</th><th className="text-right">Qty</th><th className="text-right">Price</th><th className="text-right">Total</th></tr></thead>
              <tbody>{o.items.map((it) => (
                <tr key={it._id} className="border-t border-ink/10 align-top"><td className="py-2"><p className="font-bold">{it.name}</p><p className="text-xs text-muted">{it.kind === 'box' ? it.boxSelections.map((s) => `${s.qty}× ${s.name}`).join(', ') : it.variantName}</p></td><td className="py-2 text-xs">{it.sku}</td><td className="py-2 text-right">{it.qty}</td><td className="py-2 text-right">{inr(it.unitPrice)}</td><td className="py-2 text-right font-bold">{inr(it.lineTotal)}</td></tr>
              ))}</tbody>
            </table>
            <div className="ml-auto mt-4 max-w-xs space-y-1 text-sm font-semibold">
              <Row l="Subtotal" v={inr(o.subtotal)} />{o.discount > 0 && <Row l={`Discount (${o.couponCode})`} v={`−${inr(o.discount)}`} />}<Row l="Shipping" v={o.shippingFee ? inr(o.shippingFee) : 'FREE'} />{o.codFee > 0 && <Row l="COD fee" v={inr(o.codFee)} />}<Row l="GST incl." v={inr(o.taxIncluded)} /><div className="flex justify-between border-t-2 border-ink pt-1 font-display text-lg font-extrabold"><span>Total</span><span>{inr(o.total)}</span></div>
            </div>
          </Panel>
          <Panel title="Update status">
            {options.length === 0 ? <p className="text-sm font-bold text-muted">This order is closed.</p> : (
              <form onSubmit={updateStatus} className="grid gap-3 sm:grid-cols-2">
                <Field label="New status"><select className="input" required value={st.status} onChange={(e) => setSt({ ...st, status: e.target.value })}><option value="">Choose…</option>{options.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</select></Field>
                <Field label="Note (shown in history)"><input className="input" value={st.note} onChange={(e) => setSt({ ...st, note: e.target.value })} /></Field>
                {st.status === 'shipped' && <>
                  <Field label="Carrier"><input className="input" placeholder="Shiprocket / Delhivery…" value={st.carrier} onChange={(e) => setSt({ ...st, carrier: e.target.value })} /></Field>
                  <Field label="AWB / tracking no."><input className="input" value={st.awb} onChange={(e) => setSt({ ...st, awb: e.target.value })} /></Field>
                  <Field label="Tracking URL" className="sm:col-span-2"><input className="input" type="url" value={st.url} onChange={(e) => setSt({ ...st, url: e.target.value })} /></Field>
                </>}
                {o.status === 'pending' && o.paymentMethod === 'razorpay' && o.paymentStatus !== 'paid' && <p className="text-xs font-bold text-orange sm:col-span-2">Online payment not received — the server will refuse to confirm this order.</p>}
                <button disabled={busy || !st.status} className="btn btn-dark sm:col-span-2">{busy ? <Spinner /> : 'Update status'}</button>
              </form>
            )}
            <p className="mt-3 text-xs text-muted">Customers get an email on shipped / out for delivery / delivered / cancelled / refunded. Cancel & refund restore stock (refund after delivery doesn't).</p>
          </Panel>
          <Panel title="Internal notes">
            <ul className="mb-3 space-y-2">{o.internalNotes?.map((n, i) => <li key={i} className="rounded-xl bg-cream p-3 text-sm"><p>{n.text}</p><p className="mt-1 text-[10px] font-bold text-muted">{n.by} · {fmtDateTime(n.at)}</p></li>)}{!o.internalNotes?.length && <li className="text-sm text-muted">No notes.</li>}</ul>
            <form onSubmit={addNote} className="flex gap-2"><input className="input py-2" placeholder="Add a note (team only)" aria-label="Add a note" value={note} onChange={(e) => setNote(e.target.value)} /><button className="btn btn-sm btn-light">Add</button></form>
          </Panel>
        </div>
        <div className="space-y-6">
          <Panel title="Customer">
            <p className="font-extrabold">{o.customerName}</p><p className="text-sm">{o.email}</p><p className="text-sm">{o.phone}</p>
            {o.user && <Link to={`/admin/customers/${o.user._id}`} className="mt-2 inline-block text-xs font-extrabold uppercase underline">View customer</Link>}
          </Panel>
          <Panel title="Ship to"><p className="text-sm"><b>{o.shippingAddress.name}</b> · {o.shippingAddress.phone}<br />{o.shippingAddress.line1}{o.shippingAddress.line2 ? `, ${o.shippingAddress.line2}` : ''}{o.shippingAddress.landmark ? ` (${o.shippingAddress.landmark})` : ''}<br />{o.shippingAddress.city}, {o.shippingAddress.state} {o.shippingAddress.pincode}</p>
            {o.tracking?.awb && <p className="mt-2 rounded-xl bg-cream p-2 text-xs font-bold">{o.tracking.carrier} · {o.tracking.awb}</p>}
          </Panel>
          <Panel title="Payments">
            {data.payments.map((p) => (
              <div key={p._id} className="mb-2 rounded-xl bg-cream p-3 text-xs">
                <p className="font-extrabold uppercase">{p.provider}{p.provider === 'mock' && ' (test simulator)'} · {p.status}</p>
                <p>{inr(p.amount)} {p.method && `· ${p.method}`}</p>
                {p.providerOrderId && <p className="break-all text-muted">Order: {p.providerOrderId}</p>}
                {p.providerPaymentId && <p className="break-all text-muted">Payment: {p.providerPaymentId}</p>}
                {p.failureReason && <p className="text-magenta">Failed: {p.failureReason}</p>}
                {p.refunds?.map((r) => <p key={r.refundId}>Refund {r.refundId}: {inr(r.amount)} ({r.status})</p>)}
              </div>
            ))}
            {!data.payments.length && <p className="text-sm text-muted">No payment attempts.</p>}
          </Panel>
          <Panel title="History"><OrderTimeline order={o} />
            <ul className="mt-4 space-y-1 border-t border-ink/10 pt-3 text-xs">{o.statusHistory.map((h, i) => <li key={i}><b>{STATUS_LABEL[h.status]}</b> · {fmtDateTime(h.at)}{h.note ? ` — ${h.note}` : ''}</li>)}</ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}
const Row = ({ l, v }) => <div className="flex justify-between"><span>{l}</span><span>{v}</span></div>;
