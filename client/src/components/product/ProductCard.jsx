import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Heart, Plus, Star } from 'lucide-react';
import ProductImage from './ProductImage';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { colorsFor, gradient, inr, pct, isLight } from '../../utils/format';
import { FRUIT_FOR } from '../ui/Decor';

export default function ProductCard({ product, tilt = 0, size = 'md', layout = 'grid', index = 0 }) {
  const { addProduct, busy } = useCart();
  const { user, wishlist, toggleWishlist } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const reduce = useReducedMotion();
  const btnRef = useRef(null);
  const [hover, setHover] = useState(false);
  const c = colorsFor(product);
  const variant = product.variants?.find((v) => v.isDefault) || product.variants?.[0];
  const price = variant?.price ?? product.price;
  const mrp = variant?.mrp ?? product.mrp;
  const off = pct(mrp, price);
  const soldOut = !product.inStock && product.stock <= 0;
  const light = isLight(c.from);
  const wished = wishlist.includes(String(product._id));
  const Fruit = FRUIT_FOR[product.flavour];

  const onWish = async (e) => {
    e.preventDefault();
    if (!user) return nav(`/login?next=/product/${product.slug}`);
    try { const added = await toggleWishlist(product._id); toast.success(added ? 'Saved to wishlist 💜' : 'Removed from wishlist'); } catch (err) { toast.error(err.message); }
  };
  const onAdd = (e) => { e.preventDefault(); if (variant) addProduct(product, variant, 1, btnRef.current).catch(() => {}); };

  if (layout === 'list') {
    return (
      <Link to={`/product/${product.slug}`} className="sticker group flex items-center gap-4 overflow-hidden bg-white p-3 transition hover:-translate-y-1 sm:gap-6">
        <div className="relative grid h-32 w-28 shrink-0 place-items-center overflow-hidden rounded-2xl sm:h-40 sm:w-36" style={{ background: gradient(c) }}>
          <ProductImage product={product} className="h-[88%] w-auto object-contain transition group-hover:scale-110 group-hover:rotate-6" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="display text-2xl text-grape sm:text-3xl">{product.name}</h3>
          <p className="text-sm text-muted">{product.tagline}</p>
          <div className="mt-1 flex items-center gap-1 text-sm font-bold"><Star className="h-4 w-4 fill-lemon" /> {product.ratingAvg?.toFixed(1)} <span className="font-medium opacity-60">({product.ratingCount})</span></div>
          <div className="mt-2 flex flex-wrap items-center gap-2"><span className="font-display text-xl font-extrabold">{inr(price)}</span>{off > 0 && <span className="text-sm line-through opacity-50">{inr(mrp)}</span>}<span className="text-xs font-semibold text-muted">/ {variant?.name}</span></div>
        </div>
        <div className="flex shrink-0 flex-col gap-2 pr-1">
          <button onClick={onWish} aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'} className="grid h-10 w-10 place-items-center rounded-full border-[3px] border-ink bg-white hover:bg-lemon"><Heart className={`h-5 w-5 ${wished ? 'fill-pink text-pink' : ''}`} /></button>
          <button ref={btnRef} onClick={onAdd} disabled={soldOut || busy} aria-label="Quick add" className="grid h-10 w-10 place-items-center rounded-full border-[3px] border-ink bg-lime hover:bg-lemon disabled:opacity-40"><Plus className="h-5 w-5" strokeWidth={3} /></button>
        </div>
      </Link>
    );
  }

  return (
    <motion.article
      initial={reduce ? false : { opacity: 0, y: 40, rotate: tilt * 2 }}
      whileInView={{ opacity: 1, y: 0, rotate: tilt }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ type: 'spring', stiffness: 120, damping: 16, delay: (index % 4) * 0.06 }}
      whileHover={reduce ? undefined : { rotate: 0, y: -8 }}
      onHoverStart={() => setHover(true)} onHoverEnd={() => setHover(false)}
      className="group relative h-full">
      <Link to={`/product/${product.slug}`} className="sticker flex h-full flex-col overflow-hidden bg-white transition-shadow hover:shadow-[10px_10px_0_#1c0a3d]" aria-label={`${product.name} — ${inr(price)}`}>
        <div className={`relative isolate grid place-items-center overflow-hidden ${size === 'lg' ? 'aspect-[4/4.2] lg:aspect-auto lg:min-h-[320px] lg:flex-1' : 'aspect-[4/4.4]'}`} style={{ background: hover ? gradient(c, 200) : gradient(c) }}>
          <div className="dots-bg absolute inset-0 opacity-40" />
          {Fruit && <Fruit className="absolute -bottom-4 -left-4 h-24 w-24 transition duration-500 group-hover:-rotate-45 group-hover:scale-110" />}
          <ProductImage product={product} eager={index < 2} className="relative z-10 h-[86%] w-auto object-contain drop-shadow-[0_18px_18px_rgba(28,10,61,.25)] transition duration-500 ease-out group-hover:scale-[1.08] group-hover:rotate-[8deg] lg:max-h-[440px]" />
          <div className="absolute left-3 top-3 z-20 flex flex-col items-start gap-1.5">
            {product.isBestseller && <span className="chip -rotate-3 bg-lemon">🔥 Bestseller</span>}
            {product.isNewArrival && <span className="chip rotate-2 bg-sky">✨ New</span>}
            {soldOut && <span className="chip bg-ink text-white">Sold out</span>}
          </div>
          {off > 0 && <span className="absolute bottom-3 right-3 z-20 grid h-14 w-14 rotate-12 place-items-center rounded-full border-[3px] border-ink bg-white font-display text-xs font-extrabold leading-none text-ink">{off}%<br />OFF</span>}
          <button onClick={onWish} aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'} className="absolute right-3 top-3 z-20 grid h-10 w-10 place-items-center rounded-full border-[3px] border-ink bg-white transition hover:scale-110 hover:bg-lemon active:scale-90">
            <Heart className={`h-5 w-5 transition ${wished ? 'fill-pink text-pink' : ''}`} />
          </button>
        </div>
        <div className={`flex flex-col gap-1 p-4 ${size === 'lg' ? '' : 'flex-1'}`}>
          <div className="flex items-start justify-between gap-2">
            <h3 className={`display text-grape ${size === 'lg' ? 'text-3xl' : 'text-2xl'}`}>{product.name}</h3>
            <span className="mt-1 inline-flex shrink-0 items-center gap-1 text-sm font-extrabold"><Star className="h-4 w-4 fill-lemon" />{(product.ratingAvg || 0).toFixed(1)}<span className="text-xs font-semibold opacity-50">({product.ratingCount || 0})</span></span>
          </div>
          <p className="text-sm font-medium text-muted">{product.tagline}</p>
          <div className="mt-auto flex items-end justify-between gap-2 pt-3">
            <div>
              <div className="flex items-baseline gap-2"><span className="font-display text-xl font-extrabold">{inr(price)}</span>{off > 0 && <span className="text-sm font-semibold line-through opacity-50">{inr(mrp)}</span>}</div>
              <span className="text-[11px] font-bold uppercase tracking-wide text-muted">{variant?.name}</span>
            </div>
            <button ref={btnRef} onClick={onAdd} disabled={soldOut || busy} className={`btn btn-sm ${light ? 'btn-dark' : 'btn-lime'}`} aria-label={`Quick add ${product.name}`}>
              <Plus className="h-4 w-4" strokeWidth={3} /> Add
            </button>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
