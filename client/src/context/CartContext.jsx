import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { api } from '../services/api';
import { useToast } from './ToastContext';

const CartCtx = createContext(null);

export function CartProvider({ children }) {
  const toast = useToast();
  const [cart, setCart] = useState(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [flyers, setFlyers] = useState([]);
  const cartIconRef = useRef(null);

  const refresh = useCallback(async () => {
    try { const r = await api.get('/cart'); setCart(r.cart); } catch { /* offline */ }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => { const h = () => refresh(); window.addEventListener('popsyy:auth', h); return () => window.removeEventListener('popsyy:auth', h); }, [refresh]);

  // Animated popsicle flying from the clicked element into the cart icon
  const fly = useCallback((fromEl, color = '#FF2E93') => {
    const target = cartIconRef.current;
    if (!fromEl || !target || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const a = fromEl.getBoundingClientRect();
    const b = target.getBoundingClientRect();
    const f = { id: Date.now() + Math.random(), x0: a.left + a.width / 2, y0: a.top + a.height / 2, x1: b.left + b.width / 2, y1: b.top + b.height / 2, color };
    setFlyers((s) => [...s, f]);
    setTimeout(() => setFlyers((s) => s.filter((x) => x.id !== f.id)), 900);
  }, []);

  const mutate = async (fn, { success, openDrawer = false } = {}) => {
    setBusy(true);
    try {
      const r = await fn();
      setCart(r.cart);
      if (success) toast.success(success);
      if (openDrawer) setTimeout(() => setOpen(true), 550);
      return r.cart;
    } catch (e) {
      toast.error(e.message);
      throw e;
    } finally {
      setBusy(false);
    }
  };

  const addProduct = (product, variant, qty = 1, fromEl, { openDrawer = true } = {}) => {
    fly(fromEl, product.colors?.from);
    return mutate(() => api.post('/cart', { kind: 'product', productId: product._id, variantId: variant._id, qty }), { success: `${product.name} · ${variant.name} added 🍭`, openDrawer });
  };
  const addBox = (size, selections, fromEl) => {
    fly(fromEl, '#FF8A00');
    return mutate(() => api.post('/cart', { kind: 'box', size, selections, qty: 1 }), { success: `Your ${size}-pop box is in the cart 📦`, openDrawer: true });
  };
  const updateQty = (lineId, qty) => mutate(() => api.put(`/cart/${lineId}`, { qty }));
  const remove = (lineId) => mutate(() => api.del(`/cart/${lineId}`));
  const applyCoupon = (code) => mutate(() => api.post('/cart/coupon', { code }), { success: `${code.toUpperCase()} applied 🎉` });
  const removeCoupon = () => mutate(() => api.del('/cart/coupon'));

  const count = cart?.lines?.filter((l) => !l.invalid).reduce((a, l) => a + l.qty, 0) || 0;

  return (
    <CartCtx.Provider value={{ cart, count, open, setOpen, busy, refresh, addProduct, addBox, updateQty, remove, applyCoupon, removeCoupon, cartIconRef, setCart }}>
      {children}
      <div className="pointer-events-none fixed inset-0 z-[130]" aria-hidden="true">
        <AnimatePresence>
          {flyers.map((f) => (
            <motion.div key={f.id} className="absolute left-0 top-0"
              initial={{ x: f.x0 - 14, y: f.y0 - 24, scale: 1.2, rotate: -20, opacity: 1 }}
              animate={{ x: [f.x0 - 14, (f.x0 + f.x1) / 2 - 14, f.x1 - 14], y: [f.y0 - 24, Math.min(f.y0, f.y1) - 140, f.y1 - 24], scale: [1.2, 1, 0.4], rotate: [-20, 200, 360], opacity: [1, 1, 0.6] }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}>
              <svg width="28" height="48" viewBox="0 0 28 48"><rect x="11" y="32" width="6" height="16" rx="3" fill="#E9C58F" /><path d="M3 8Q3 1 10 1h8q7 0 7 7v22q0 4-4 4H7q-4 0-4-4z" fill={f.color} stroke="#1c0a3d" strokeWidth="2" /></svg>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </CartCtx.Provider>
  );
}
export const useCart = () => useContext(CartCtx);
