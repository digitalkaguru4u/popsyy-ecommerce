import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import Seo from '../components/ui/Seo';
import { PageSpinner } from '../components/ui/Spinner';
import { useFetch } from '../hooks/useFetch';
import { inr } from '../utils/format';
import PopArt from '../components/product/PopArt';

export default function OrderSuccess() {
  const { id } = useParams();
  const { data, loading } = useFetch(`/orders/${id}`, { ttl: 0 });
  const order = data?.order;
  useEffect(() => {
    if (!order || order.status === 'pending') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const colors = ['#FF2E93', '#D7FF3A', '#FF8A00', '#7B2FF7', '#26C6FF', '#FFE14D'];
    confetti({ particleCount: 140, spread: 90, origin: { y: 0.6 }, colors });
    const t = setTimeout(() => { confetti({ particleCount: 80, angle: 60, spread: 70, origin: { x: 0 }, colors }); confetti({ particleCount: 80, angle: 120, spread: 70, origin: { x: 1 }, colors }); }, 400);
    return () => clearTimeout(t);
  }, [order]);
  if (loading || !order) return <PageSpinner />;
  return (
    <div className="container-pop py-10">
      <Seo title="Order placed" noindex />
      <div className="relative mx-auto max-w-2xl overflow-hidden rounded-[2.5rem] border-[3px] border-ink bg-purple p-8 text-center text-white shadow-[10px_10px_0_#1c0a3d] md:p-12">
        <motion.div initial={{ y: 60, rotate: -40, scale: 0.4 }} animate={{ y: 0, rotate: -12, scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 10 }} className="mx-auto w-20"><PopArt color="#D7FF3A" color2="#FF2E93" /></motion.div>
        <h1 className="display mt-6 text-5xl md:text-7xl" style={{ textShadow: '4px 4px 0 #1c0a3d' }}>{order.status === 'pending' ? 'ALMOST THERE.' : 'POP! ORDER PLACED.'}</h1>
        <p className="mt-3 text-lg font-bold text-white/90">{order.status === 'pending' ? 'Your order is waiting on payment.' : 'Your taste buds just got a text. We’ll email you when it ships.'}</p>
        <div className="mx-auto mt-6 inline-grid gap-1 rounded-2xl border-[3px] border-ink bg-white px-6 py-4 text-left text-ink">
          <p className="text-xs font-extrabold uppercase text-muted">Order number</p>
          <p className="font-display text-2xl font-extrabold">{order.orderNumber}</p>
          <p className="text-sm font-semibold">{inr(order.total)} · {order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentStatus === 'paid' ? 'Paid online' : 'Payment pending'}</p>
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to={`/account/orders/${order._id}`} className="btn btn-lime">Track order</Link>
          <Link to="/shop" className="btn btn-light">Keep shopping</Link>
        </div>
      </div>
    </div>
  );
}
