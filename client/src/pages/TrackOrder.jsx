import { useState } from 'react';
import Seo from '../components/ui/Seo';
import Field from '../components/ui/Field';
import Spinner from '../components/ui/Spinner';
import OrderTimeline from '../components/OrderTimeline';
import { api } from '../services/api';
import { STATUS_LABEL, fmtDate, inr } from '../utils/format';

export default function TrackOrder() {
  const [f, setF] = useState({ orderNumber: '', email: '' });
  const [order, setOrder] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setErr(''); setLoading(true);
    try { const r = await api.post('/orders/track', f); setOrder(r.order); } catch (e2) { setErr(e2.message); setOrder(null); } finally { setLoading(false); }
  };
  return (
    <div className="container-pop max-w-4xl py-8">
      <Seo title="Track your order" description="Track your POPSYY order with your order number and email." path="/track-order" />
      <h1 className="display text-6xl text-grape md:text-8xl">WHERE'S MY <span className="text-pink">POP?</span></h1>
      <form onSubmit={submit} className="sticker mt-8 grid gap-4 bg-white p-6 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <Field label="Order number"><input required className="input uppercase" placeholder="POP-XXXXXXX" value={f.orderNumber} onChange={(e) => setF({ ...f, orderNumber: e.target.value.toUpperCase() })} /></Field>
        <Field label="Email used at checkout"><input required type="email" className="input" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
        <button disabled={loading} className="btn btn-primary h-[52px]">{loading ? <Spinner /> : 'Track'}</button>
      </form>
      {err && <p className="mt-4 rounded-2xl bg-pink/10 p-4 font-bold text-magenta" role="alert">{err}</p>}
      {order && (
        <div className="mt-8 grid gap-6 md:grid-cols-[1fr_1.2fr]">
          <div className="sticker bg-lemon p-6">
            <p className="text-xs font-extrabold uppercase">Order</p>
            <p className="display text-3xl">{order.orderNumber}</p>
            <p className="mt-2 font-bold">{STATUS_LABEL[order.status]}</p>
            <p className="text-sm">Placed {fmtDate(order.createdAt)} · {order.itemCount} item(s) · {inr(order.total)}</p>
            <p className="text-sm">Shipping to {order.shippingAddress?.city}</p>
            {order.tracking?.awb && <p className="mt-3 rounded-xl bg-white p-3 text-sm font-bold">{order.tracking.carrier} · AWB {order.tracking.awb}{order.tracking.url && <> · <a href={order.tracking.url} target="_blank" rel="noreferrer" className="underline">Carrier tracking</a></>}</p>}
          </div>
          <div className="sticker bg-white p-6"><OrderTimeline order={order} /></div>
        </div>
      )}
    </div>
  );
}
