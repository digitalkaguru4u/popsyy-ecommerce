import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Truck } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import CartLine from '../product/CartLine';
import { inr } from '../../utils/format';
import PopArt from '../product/PopArt';

export function FreeShippingBar({ cart }) {
  if (!cart) return null;
  const { threshold, remaining } = cart.freeShipping;
  const p = Math.min(100, ((threshold - remaining) / threshold) * 100);
  return (
    <div className="rounded-2xl border-[3px] border-ink bg-lemon p-3">
      <p className="flex items-center gap-2 text-sm font-extrabold"><Truck className="h-4 w-4" />{remaining > 0 ? <>{inr(remaining)} away from FREE SHIPPING 🍧</> : <>FREE cold-chain shipping unlocked 🧊</>}</p>
      <div className="mt-2 h-3 overflow-hidden rounded-full border-2 border-ink bg-white"><motion.div className="h-full bg-gradient-to-r from-pink via-orange to-lime" initial={{ width: 0 }} animate={{ width: `${p}%` }} transition={{ type: 'spring', stiffness: 80 }} /></div>
    </div>
  );
}

export default function CartDrawer() {
  const { cart, open, setOpen, count } = useCart();
  const nav = useNavigate();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!open) return undefined;
    const h = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', h);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', h); document.body.style.overflow = ''; };
  }, [open, setOpen]);
  if (!mounted) return null;
  const lines = cart?.lines || [];
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[95] bg-ink/50 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)}>
          <motion.aside role="dialog" aria-label="Your cart" onClick={(e) => e.stopPropagation()}
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', stiffness: 300, damping: 32 }}
            className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l-[3px] border-ink bg-paper">
            <div className="flex items-center justify-between border-b-[3px] border-ink bg-purple px-5 py-4 text-white">
              <h2 className="display text-3xl">Your Stash <span className="text-lime">({count})</span></h2>
              <button onClick={() => setOpen(false)} aria-label="Close cart" className="grid h-10 w-10 place-items-center rounded-full border-[3px] border-ink bg-lime text-ink"><X className="h-5 w-5" /></button>
            </div>
            {lines.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                <div className="w-20 animate-wiggle"><PopArt color="#FF2E93" color2="#FF8A00" bite /></div>
                <p className="display mt-6 text-3xl text-grape">YOUR CART IS GIVING… NOTHING.</p>
                <p className="mt-2 text-muted">Fix that. Your freezer deserves better.</p>
                <button onClick={() => { setOpen(false); nav('/shop'); }} className="btn btn-primary mt-6">SHOP POPS</button>
              </div>
            ) : (
              <>
                <div className="flex-1 space-y-3 overflow-y-auto p-4">
                  <FreeShippingBar cart={cart} />
                  {lines.map((l) => <CartLine key={l._id} line={l} compact />)}
                </div>
                <div className="space-y-3 border-t-[3px] border-ink bg-white p-5">
                  <div className="flex justify-between text-sm font-semibold"><span>Subtotal</span><span>{inr(cart.subtotal)}</span></div>
                  {cart.discount > 0 && <div className="flex justify-between text-sm font-semibold text-magenta"><span>Discount ({cart.couponCode})</span><span>−{inr(cart.discount)}</span></div>}
                  <div className="flex justify-between text-sm font-semibold"><span>Shipping</span><span>{cart.shippingFee ? inr(cart.shippingFee) : 'FREE'}</span></div>
                  <div className="flex items-baseline justify-between border-t-2 border-dashed border-ink/20 pt-3"><span className="display text-2xl">Total</span><span className="display text-3xl">{inr(cart.total)}</span></div>
                  {cart.hasIssues && <p className="rounded-xl bg-pink/10 p-2 text-xs font-bold text-magenta">Some items need attention — review them in your cart.</p>}
                  <div className="grid grid-cols-2 gap-2">
                    <Link to="/cart" onClick={() => setOpen(false)} className="btn btn-light">View cart</Link>
                    <button onClick={() => { setOpen(false); nav('/checkout'); }} disabled={cart.hasIssues} className="btn btn-primary">Checkout</button>
                  </div>
                </div>
              </>
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
