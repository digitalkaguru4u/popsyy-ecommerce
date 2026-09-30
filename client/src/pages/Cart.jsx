import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Tag, X } from 'lucide-react';
import Seo from '../components/ui/Seo';
import CartLine from '../components/product/CartLine';
import { FreeShippingBar } from '../components/layout/CartDrawer';
import EmptyState from '../components/ui/EmptyState';
import ProductCard from '../components/product/ProductCard';
import { useCart } from '../context/CartContext';
import { useFetch } from '../hooks/useFetch';
import { inr } from '../utils/format';

export function CouponBox() {
  const { cart, applyCoupon, removeCoupon, busy } = useCart();
  const [code, setCode] = useState('');
  if (cart?.couponValid) {
    return (
      <div className="flex items-center justify-between rounded-2xl border-[3px] border-ink bg-lime px-4 py-3">
        <span className="flex items-center gap-2 font-extrabold"><Tag className="h-4 w-4" /> {cart.couponCode} <span className="text-sm font-semibold">−{inr(cart.discount)}</span></span>
        <button onClick={removeCoupon} aria-label="Remove coupon" className="grid h-8 w-8 place-items-center rounded-full hover:bg-white"><X className="h-4 w-4" /></button>
      </div>
    );
  }
  return (
    <form onSubmit={async (e) => { e.preventDefault(); if (code.trim()) { try { await applyCoupon(code.trim()); setCode(''); } catch { /* toast */ } } }} className="space-y-1">
      <div className="flex gap-2">
        <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Coupon code" aria-label="Coupon code" className="input flex-1 uppercase" />
        <button disabled={busy || !code.trim()} className="btn btn-dark">Apply</button>
      </div>
      {cart?.couponError && <p className="text-xs font-bold text-magenta">{cart.couponCode}: {cart.couponError}</p>}
    </form>
  );
}

export function Summary({ cart, children }) {
  return (
    <div className="space-y-2 text-[15px]">
      <Row l={`Subtotal (${cart.itemCount} item${cart.itemCount === 1 ? '' : 's'} · ${cart.pops} pops)`} v={inr(cart.subtotal)} />
      {cart.mrpTotal > cart.subtotal && <Row l="You save on MRP" v={`−${inr(cart.mrpTotal - cart.subtotal)}`} muted />}
      {cart.discount > 0 && <Row l={`Coupon (${cart.couponCode})`} v={`−${inr(cart.discount)}`} accent />}
      <Row l="Shipping" v={cart.shippingFee ? inr(cart.shippingFee) : 'FREE'} />
      {cart.codFee > 0 && <Row l="COD fee" v={inr(cart.codFee)} />}
      <Row l={`GST (${cart.gstRate}%, included)`} v={inr(cart.taxIncluded)} muted />
      <div className="flex items-baseline justify-between border-t-[3px] border-dashed border-ink/20 pt-3"><span className="display text-2xl">Total</span><span className="display text-4xl text-grape">{inr(cart.total)}</span></div>
      {children}
    </div>
  );
}
const Row = ({ l, v, muted, accent }) => <div className={`flex justify-between gap-4 font-semibold ${muted ? 'text-muted' : ''} ${accent ? 'text-magenta' : ''}`}><span>{l}</span><span className="shrink-0">{v}</span></div>;

export default function Cart() {
  const { cart } = useCart();
  const nav = useNavigate();
  const recs = useFetch('/products?sort=popular&limit=4');
  const lines = cart?.lines || [];
  const inCart = new Set(lines.filter((l) => l.kind === 'product').map((l) => l.product._id));
  return (
    <div className="container-pop pb-10 pt-6">
      <Seo title="Your cart" noindex path="/cart" />
      <h1 className="display text-6xl text-grape md:text-8xl">YOUR <span className="text-pink">STASH</span></h1>
      {lines.length === 0 ? (
        <EmptyState title="YOUR CART IS GIVING… NOTHING." text="Fix that. Your freezer deserves better." />
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_400px]">
          <div className="space-y-4">
            <FreeShippingBar cart={cart} />
            {lines.map((l) => <CartLine key={l._id} line={l} />)}
            <Link to="/shop" className="inline-block font-display text-sm font-extrabold uppercase underline">← Keep shopping</Link>
          </div>
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="sticker space-y-5 bg-white p-6">
              <h2 className="display text-3xl text-grape">Summary</h2>
              <CouponBox />
              <Summary cart={cart} />
              {cart.hasIssues && <p className="rounded-xl bg-pink/10 p-3 text-sm font-bold text-magenta">Some items are unavailable or low on stock — update them to continue.</p>}
              <button onClick={() => nav('/checkout')} disabled={cart.hasIssues} className="btn btn-primary btn-lg w-full">Checkout · {inr(cart.total)}</button>
              <p className="text-center text-xs font-semibold text-muted">UPI · Cards · Netbanking · Wallets · Cash on Delivery</p>
            </div>
          </aside>
        </div>
      )}
      {recs.data?.products?.filter((p) => !inCart.has(p._id)).length > 0 && (
        <section className="mt-16">
          <h2 className="display text-4xl text-grape md:text-5xl">ADD ONE MORE? <span className="hand text-3xl text-purple">go on</span></h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{recs.data.products.filter((p) => !inCart.has(p._id)).slice(0, 4).map((p, i) => <ProductCard key={p._id} product={p} index={i} />)}</div>
        </section>
      )}
    </div>
  );
}
