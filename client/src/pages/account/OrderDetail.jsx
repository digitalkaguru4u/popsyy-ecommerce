import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileText, Star } from 'lucide-react';
import OrderTimeline from '../../components/OrderTimeline';
import Spinner, { PageSpinner } from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';
import PopArt from '../../components/product/PopArt';
import { useFetch } from '../../hooks/useFetch';
import usePayment from '../../hooks/usePayment';
import { api, apiUrl } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useCart } from '../../context/CartContext';
import { FLAVOUR_COLORS, PAYMENT_LABEL, STATUS_COLOR, STATUS_LABEL, fmtDateTime, inr } from '../../utils/format';

export default function OrderDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const { refresh } = useCart();
  const { data, loading, reload } = useFetch(`/orders/${id}`, { ttl: 0 });
  const { pay, modal } = usePayment();
  const [busy, setBusy] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  if (loading && !data) return <PageSpinner />;
  if (!data?.order) return <p className="font-bold">Order not found.</p>;
  const o = data.order;
  const canPay = o.status === 'pending' && o.paymentMethod === 'razorpay' && o.paymentStatus !== 'paid';
  const canCancel = ['pending', 'confirmed', 'processing'].includes(o.status);

  const payNow = async () => {
    setBusy(true);
    try {
      const r = await pay(o._id);
      if (r.status === 'paid') { await refresh(); nav(`/order/success/${o._id}`); } else toast.error(r.message);
      reload();
    } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };
  const cancel = async () => {
    setBusy(true);
    try { await api.post(`/orders/${o._id}/cancel`, { reason: 'Cancelled by customer' }); toast.success('Order cancelled'); setConfirmCancel(false); reload(); } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };

  return (
    <div className="space-y-6">
      {modal}
      <Link to="/account/orders" className="inline-flex items-center gap-1 text-sm font-extrabold uppercase"><ArrowLeft className="h-4 w-4" /> All orders</Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="display text-4xl text-grape">{o.orderNumber}</h2><p className="text-sm text-muted">Placed {fmtDateTime(o.createdAt)}</p></div>
        <div className="flex flex-wrap gap-2"><span className={`chip ${STATUS_COLOR[o.status]}`}>{STATUS_LABEL[o.status]}</span><span className="chip">{PAYMENT_LABEL[o.paymentStatus]}</span></div>
      </div>
      {canPay && (
        <div className="sticker flex flex-wrap items-center justify-between gap-3 bg-lemon p-5">
          <p className="font-bold">{o.paymentStatus === 'failed' ? 'Your last payment attempt failed.' : 'This order is waiting for payment.'} Complete it to confirm your pops.</p>
          <button onClick={payNow} disabled={busy} className="btn btn-primary">{busy ? <Spinner /> : `Pay ${inr(o.total)}`}</button>
        </div>
      )}
      <div className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
        <div className="sticker bg-white p-6">
          <h3 className="display mb-5 text-2xl">Tracking</h3>
          <OrderTimeline order={o} />
          {o.tracking?.awb && <p className="mt-5 rounded-xl bg-cream p-3 text-sm font-bold">{o.tracking.carrier} · AWB {o.tracking.awb}{o.tracking.url && <> · <a href={o.tracking.url} target="_blank" rel="noreferrer" className="underline">Track with carrier</a></>}</p>}
        </div>
        <div className="space-y-6">
          <div className="sticker bg-white p-6">
            <h3 className="display mb-4 text-2xl">Items</h3>
            <ul className="space-y-3">
              {o.items.map((it) => {
                const c = FLAVOUR_COLORS[it.flavour] || { from: '#FF2E93', to: '#FF8A00' };
                return (
                  <li key={it._id} className="flex items-center gap-3">
                    <PopArt color={c.from} color2={c.to} className="h-14 w-9 shrink-0" />
                    <div className="min-w-0 flex-1 text-sm"><p className="font-extrabold">{it.name}</p><p className="text-muted">{it.kind === 'box' ? it.boxSelections.map((s) => `${s.qty}× ${s.name}`).join(', ') : it.variantName} · qty {it.qty}</p></div>
                    <div className="text-right font-bold">{inr(it.lineTotal)}{o.status === 'delivered' && it.product?.slug && <Link to={`/product/${it.product.slug}#reviews`} className="mt-1 flex items-center gap-1 text-xs text-purple underline"><Star className="h-3 w-3" /> Review</Link>}</div>
                  </li>
                );
              })}
            </ul>
            <div className="mt-4 space-y-1 border-t-2 border-dashed border-ink/20 pt-4 text-sm font-semibold">
              <div className="flex justify-between"><span>Subtotal</span><span>{inr(o.subtotal)}</span></div>
              {o.discount > 0 && <div className="flex justify-between text-magenta"><span>Discount ({o.couponCode})</span><span>−{inr(o.discount)}</span></div>}
              <div className="flex justify-between"><span>Shipping ({o.deliveryMethod})</span><span>{o.shippingFee ? inr(o.shippingFee) : 'FREE'}</span></div>
              {o.codFee > 0 && <div className="flex justify-between"><span>COD fee</span><span>{inr(o.codFee)}</span></div>}
              <div className="flex justify-between font-display text-xl font-extrabold"><span>Total</span><span>{inr(o.total)}</span></div>
            </div>
          </div>
          <div className="sticker bg-white p-6 text-sm">
            <h3 className="display mb-2 text-2xl">Delivery to</h3>
            <p className="font-bold">{o.shippingAddress.name} · {o.shippingAddress.phone}</p>
            <p>{o.shippingAddress.line1}{o.shippingAddress.line2 ? `, ${o.shippingAddress.line2}` : ''}, {o.shippingAddress.city}, {o.shippingAddress.state} {o.shippingAddress.pincode}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {o.status !== 'pending' && <a href={apiUrl(`/orders/${o._id}/invoice`)} target="_blank" rel="noreferrer" className="btn btn-light"><FileText className="h-4 w-4" /> Invoice</a>}
            {canCancel && <button onClick={() => setConfirmCancel(true)} className="btn btn-light text-magenta">Cancel order</button>}
          </div>
        </div>
      </div>
      <Modal open={confirmCancel} onClose={() => setConfirmCancel(false)} title="Cancel this order?">
        <p className="font-semibold">{o.paymentStatus === 'paid' ? `We'll refund ${inr(o.total)} to your original payment method (5–7 working days).` : 'Your order will be cancelled right away.'}</p>
        <div className="mt-6 flex gap-3"><button onClick={() => setConfirmCancel(false)} className="btn btn-light flex-1">Keep it</button><button onClick={cancel} disabled={busy} className="btn btn-primary flex-1">{busy ? <Spinner /> : 'Yes, cancel'}</button></div>
      </Modal>
    </div>
  );
}
