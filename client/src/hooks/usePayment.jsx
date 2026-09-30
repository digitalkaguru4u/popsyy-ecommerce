import { useCallback, useRef, useState } from 'react';
import { CreditCard, Smartphone, Landmark, Wallet, FlaskConical } from 'lucide-react';
import { api } from '../services/api';
import Modal from '../components/ui/Modal';

let rzpPromise;
function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve(true);
  if (!rzpPromise) {
    rzpPromise = new Promise((resolve) => {
      const s = document.createElement('script');
      s.src = 'https://checkout.razorpay.com/v1/checkout.js';
      s.onload = () => resolve(true);
      s.onerror = () => { rzpPromise = null; resolve(false); };
      document.body.appendChild(s);
    });
  }
  return rzpPromise;
}

/**
 * pay(orderId) → resolves { status: 'paid' | 'failed' | 'cancelled', message, order }
 * Uses real Razorpay Checkout when keys are configured; otherwise the server exposes a
 * clearly-labelled local simulator (development only).
 */
export default function usePayment() {
  const [mock, setMock] = useState(null); // { session, resolve }
  const [method, setMethod] = useState('upi');
  const resolver = useRef(null);

  const pay = useCallback(async (orderId) => {
    const { payment: session } = await api.post('/payments/create', { orderId });

    if (session.provider === 'mock') {
      return new Promise((resolve) => { resolver.current = resolve; setMock({ session, orderId }); });
    }

    const ok = await loadRazorpay();
    if (!ok) throw new Error("Couldn't load Razorpay. Check your connection and retry.");
    return new Promise((resolve) => {
      let settled = false;
      const done = (v) => { if (!settled) { settled = true; resolve(v); } };
      const rzp = new window.Razorpay({
        key: session.keyId,
        amount: session.amount,
        currency: session.currency,
        order_id: session.providerOrderId,
        name: 'POPSYY',
        description: `Order ${session.orderNumber}`,
        image: `${window.location.origin}/favicon.svg`,
        prefill: session.prefill,
        notes: { orderNumber: session.orderNumber },
        theme: { color: '#7B2FF7' },
        handler: async (resp) => {
          try {
            const r = await api.post('/payments/verify', { provider: 'razorpay', orderId, ...resp });
            done({ status: 'paid', order: r.order });
          } catch (e) {
            done({ status: 'failed', message: e.message });
          }
        },
        modal: {
          ondismiss: async () => {
            if (settled) return;
            await api.post('/payments/failed', { orderId, providerOrderId: session.providerOrderId, reason: 'Checkout closed by customer' }).catch(() => {});
            done({ status: 'cancelled', message: 'Payment cancelled.' });
          },
        },
      });
      rzp.on('payment.failed', async (resp) => {
        await api.post('/payments/failed', { orderId, providerOrderId: session.providerOrderId, reason: resp?.error?.description || 'Payment failed' }).catch(() => {});
        done({ status: 'failed', message: resp?.error?.description || 'Payment failed' });
        try { rzp.close(); } catch { /* noop */ }
      });
      rzp.open();
    });
  }, []);

  const finishMock = async (outcome) => {
    const { session, orderId } = mock;
    setMock(null);
    try {
      if (outcome === 'cancelled') {
        await api.post('/payments/failed', { orderId, providerOrderId: session.providerOrderId, reason: 'Checkout closed by customer' });
        resolver.current?.({ status: 'cancelled', message: 'Payment cancelled.' });
        return;
      }
      const r = await api.post('/payments/verify', { provider: 'mock', orderId, providerOrderId: session.providerOrderId, outcome, method });
      resolver.current?.({ status: 'paid', order: r.order });
    } catch (e) {
      resolver.current?.({ status: 'failed', message: e.message });
    }
  };

  const METHODS = [['upi', 'UPI', Smartphone], ['card', 'Card', CreditCard], ['netbanking', 'Netbanking', Landmark], ['wallet', 'Wallet', Wallet]];
  const modal = (
    <Modal open={Boolean(mock)} onClose={() => finishMock('cancelled')} title="Test payment">
      <div className="rounded-2xl border-[3px] border-dashed border-orange bg-orange/10 p-3 text-sm font-bold text-ink">
        <FlaskConical className="mr-1 inline h-4 w-4" /> Payment simulator — Razorpay keys aren't configured on this server, so no real money moves. Add RAZORPAY_KEY_ID / SECRET to go live.
      </div>
      <p className="mt-4 font-display text-3xl font-extrabold">₹{((mock?.session?.amount || 0) / 100).toLocaleString('en-IN')}</p>
      <p className="text-sm text-muted">Order {mock?.session?.orderNumber}</p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {METHODS.map(([k, l, I]) => (
          <button key={k} onClick={() => setMethod(k)} className={`flex items-center gap-2 rounded-2xl border-[3px] border-ink p-3 font-bold ${method === k ? 'bg-lime' : 'bg-white'}`}><I className="h-4 w-4" /> {l}</button>
        ))}
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <button onClick={() => finishMock('failed')} className="btn btn-light">Simulate failure</button>
        <button onClick={() => finishMock('success')} className="btn btn-primary">Pay (success)</button>
      </div>
    </Modal>
  );

  return { pay, modal };
}
