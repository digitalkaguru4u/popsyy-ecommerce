import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Heart, ShieldCheck, Snowflake, Truck, Leaf as LeafIcon, Plus, Camera, BadgeCheck } from 'lucide-react';
import Seo, { siteUrl } from '../components/ui/Seo';
import ProductImage from '../components/product/ProductImage';
import ProductCard from '../components/product/ProductCard';
import QtyStepper from '../components/ui/QtyStepper';
import Stars from '../components/ui/Stars';
import Skeleton from '../components/ui/Skeleton';
import Spinner from '../components/ui/Spinner';
import NotFound from './NotFound';
import { FRUIT_FOR, IceCube, Sparkle } from '../components/ui/Decor';
import { useFetch, invalidate } from '../hooks/useFetch';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useSettings } from '../context/SettingsContext';
import { api, assetUrl, qs } from '../services/api';
import { colorsFor, fmtDate, gradient, inr, isLight, pct } from '../utils/format';

export default function Product() {
  const { slug } = useParams();
  const { data, loading, error } = useFetch(`/products/${slug}`, { ttl: 5000 });
  if (error?.status === 404) return <NotFound />;
  if (loading || !data) return <ProductSkeleton />;
  return <ProductView key={slug} data={data} />;
}

function ProductSkeleton() {
  return (
    <div className="container-pop grid gap-10 py-8 lg:grid-cols-2">
      <Skeleton className="aspect-square w-full" />
      <div className="space-y-4"><Skeleton className="h-16 w-2/3" /><Skeleton className="h-6 w-1/3" /><Skeleton className="h-24 w-full" /><Skeleton className="h-14 w-full" /></div>
    </div>
  );
}

function ProductView({ data }) {
  const { product: p, related, frequentlyBoughtTogether: fbt } = data;
  const nav = useNavigate();
  const toast = useToast();
  const { settings } = useSettings();
  const { addProduct, busy } = useCart();
  const { user, wishlist, toggleWishlist } = useAuth();
  const c = colorsFor(p);
  const light = isLight(c.from);
  const Fruit = FRUIT_FOR[p.flavour];
  const [variant, setVariant] = useState(p.variants.find((v) => v.isDefault) || p.variants[0]);
  const [qty, setQty] = useState(1);
  const [img, setImg] = useState(0);
  const [showSticky, setShowSticky] = useState(false);
  const addRef = useRef(null);
  const stickyRef = useRef(null);
  const ctaBlock = useRef(null);
  const wished = wishlist.includes(String(p._id));
  const maxQty = Math.max(0, Math.min(50, variant?.available ?? 0));
  const soldOut = maxQty < 1;
  const off = pct(variant?.mrp, variant?.price);

  useEffect(() => {
    const el = ctaBlock.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(([e]) => setShowSticky(!e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const add = async (el) => { if (!variant) return; try { await addProduct(p, variant, qty, el); } catch { /* toast */ } };
  const buyNow = async () => { try { await addProduct(p, variant, qty, addRef.current, { openDrawer: false }); nav('/checkout'); } catch { /* toast */ } };
  const wish = async () => {
    if (!user) return nav(`/login?next=/product/${p.slug}`);
    try { const added = await toggleWishlist(p._id); toast.success(added ? 'Saved to wishlist 💜' : 'Removed from wishlist'); } catch (e) { toast.error(e.message); }
  };

  const shipping = settings?.shipping;
  const productLd = {
    '@context': 'https://schema.org', '@type': 'Product', name: `POPSYY ${p.name} Ice Pop`, description: p.shortDescription || p.description,
    image: p.images.map((i) => (i.url.startsWith('http') ? i.url : `${siteUrl}${i.url}`)), brand: { '@type': 'Brand', name: 'POPSYY' }, sku: variant?.sku,
    offers: p.variants.map((v) => ({ '@type': 'Offer', sku: v.sku, name: v.name, price: v.price, priceCurrency: 'INR', availability: v.available > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock', url: `${siteUrl}/product/${p.slug}` })),
    ...(p.ratingCount ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: p.ratingAvg, reviewCount: p.ratingCount } } : {}),
  };
  const crumbLd = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl }, { '@type': 'ListItem', position: 2, name: 'Shop', item: `${siteUrl}/shop` }, { '@type': 'ListItem', position: 3, name: p.name, item: `${siteUrl}/product/${p.slug}` }] };

  return (
    <div className="pb-28 lg:pb-10">
      <Seo title={p.seo?.title?.replace(/ \| POPSYY$/, '') || `${p.name} Ice Pop`} description={p.seo?.description || p.shortDescription} path={`/product/${p.slug}`} image={p.images[0]?.url?.endsWith('.svg') ? p.images[1]?.url : p.images[0]?.url} type="product" jsonLd={[productLd, crumbLd]} />
      <nav aria-label="Breadcrumb" className="container-pop pt-4 text-xs font-bold uppercase tracking-wide text-muted">
        <Link to="/" className="hover:text-ink">Home</Link> / <Link to="/shop" className="hover:text-ink">Shop</Link> / <span className="text-ink">{p.name}</span>
      </nav>

      <section className="container-pop mt-4 grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
        {/* gallery */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="relative aspect-square overflow-hidden rounded-[2.25rem] border-[3px] border-ink shadow-[8px_8px_0_#1c0a3d]" style={{ background: gradient(c, 150) }}>
            <div aria-hidden className="dots-bg absolute inset-0 opacity-40" />
            {Fruit && <Fruit className="absolute -bottom-10 -left-10 w-48 animate-float-slow [--r:-15deg]" />}
            <IceCube className="absolute right-[10%] top-[10%] w-16 animate-float [--r:18deg]" />
            <Sparkle className="absolute left-[12%] top-[14%] w-10 animate-spin-slow" color="#fff" />
            <AnimatePresence mode="wait">
              <motion.div key={img} className="absolute inset-0 grid place-items-center p-8" initial={{ opacity: 0, scale: 0.9, rotate: -6 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ type: 'spring', stiffness: 200, damping: 20 }}>
                <ProductImage product={p} index={img} eager className={`${p.images[img]?.url?.endsWith('.svg') ? 'h-[92%] w-auto animate-float [--r:6deg]' : 'h-full w-full rounded-3xl border-[3px] border-ink object-cover'} drop-shadow-[0_30px_30px_rgba(28,10,61,.35)]`} />
              </motion.div>
            </AnimatePresence>
            {off > 0 && <span className="absolute right-5 bottom-5 grid h-20 w-20 rotate-12 place-items-center rounded-full border-[3px] border-ink bg-lemon text-center font-display text-lg font-extrabold leading-none">{off}%<br />OFF</span>}
          </div>
          {p.images.length > 1 && (
            <div className="mt-4 flex gap-3" role="tablist" aria-label="Product images">
              {p.images.map((im, i) => (
                <button key={i} role="tab" aria-selected={img === i} aria-label={`Image ${i + 1}`} onClick={() => setImg(i)} className={`grid h-20 w-20 place-items-center overflow-hidden rounded-2xl border-[3px] border-ink transition ${img === i ? 'shadow-[3px_3px_0_#1c0a3d] -translate-y-1' : 'opacity-70 hover:opacity-100'}`} style={{ background: gradient(c) }}>
                  <ProductImage product={p} index={i} className={im.url.endsWith('.svg') ? 'h-[85%] w-auto' : 'h-full w-full object-cover'} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* info */}
        <div>
          <span className="chip" style={{ background: c.from, color: light ? '#1c0a3d' : '#fff' }}>{p.flavour.replace('-', ' ')}</span>
          {p.isBestseller && <span className="chip ml-2 bg-lemon">🔥 Bestseller</span>}
          <h1 className="display mt-4 text-6xl text-grape md:text-7xl">{p.name}</h1>
          <p className="hand mt-1 text-3xl" style={{ color: c.to }}>{p.tagline}</p>
          <a href="#reviews" className="mt-3 inline-flex items-center gap-2 font-bold"><Stars value={p.ratingAvg} size={18} /> {p.ratingAvg?.toFixed(1)} <span className="font-semibold text-muted underline">({p.ratingCount} review{p.ratingCount === 1 ? '' : 's'})</span></a>
          <p className="mt-5 text-lg font-medium text-ink/80">{p.shortDescription}</p>

          <div className="mt-6 flex flex-wrap items-baseline gap-3">
            <span className="display text-5xl text-ink">{inr(variant?.price)}</span>
            {off > 0 && <span className="text-xl font-bold line-through opacity-50">MRP {inr(variant?.mrp)}</span>}
            {off > 0 && <span className="rounded-full border-2 border-ink bg-lime px-3 py-1 text-sm font-extrabold">Save {inr(variant.mrp - variant.price)}</span>}
          </div>
          <p className="text-xs font-semibold text-muted">Incl. of all taxes · {inr(Math.round((variant.price / variant.packSize) * 10) / 10)} per pop</p>

          <div className="mt-6">
            <p className="label">Pack size</p>
            <div className="grid grid-cols-3 gap-3" role="radiogroup" aria-label="Pack size">
              {p.variants.map((v) => (
                <button key={v._id} role="radio" aria-checked={variant._id === v._id} disabled={v.available < 1} onClick={() => { setVariant(v); setQty(1); }}
                  className={`relative rounded-2xl border-[3px] border-ink p-3 text-left transition disabled:opacity-40 ${variant._id === v._id ? 'bg-ink text-white shadow-[4px_4px_0_#FF2E93]' : 'bg-white hover:bg-lemon'}`}>
                  <span className="block font-display text-2xl font-extrabold leading-none">{v.packSize}</span>
                  <span className="block text-[11px] font-extrabold uppercase">pops</span>
                  <span className="mt-1 block text-sm font-bold">{inr(v.price)}</span>
                  {v.available < 1 && <span className="text-[10px] font-bold uppercase">Sold out</span>}
                  {v.available > 0 && v.available <= 5 && <span className="text-[10px] font-bold uppercase text-orange">Only {v.available} left</span>}
                </button>
              ))}
            </div>
          </div>

          <div ref={ctaBlock} className="mt-6 flex flex-wrap items-center gap-3">
            <QtyStepper value={qty} onChange={setQty} max={Math.max(1, maxQty)} disabled={soldOut} />
            <button ref={addRef} onClick={(e) => add(e.currentTarget)} disabled={soldOut || busy} className="btn btn-primary btn-lg flex-1">{soldOut ? 'Sold out' : busy ? <Spinner /> : 'Add to cart'}</button>
            <button onClick={buyNow} disabled={soldOut || busy} className="btn btn-dark btn-lg flex-1 sm:flex-none">Buy now</button>
            <button onClick={wish} aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'} className="grid h-14 w-14 place-items-center rounded-full border-[3px] border-ink bg-white transition hover:bg-lemon active:scale-90"><Heart className={`h-6 w-6 ${wished ? 'fill-pink text-pink' : ''}`} /></button>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 text-sm font-bold sm:grid-cols-4">
            {[[Snowflake, 'Ships frozen'], [Truck, shipping ? `Free over ${inr(shipping.freeThreshold)}` : 'Fast delivery'], [LeafIcon, '100% veg'], [ShieldCheck, 'Melt-safe promise']].map(([I, t]) => (
              <div key={t} className="flex items-center gap-2 rounded-2xl border-2 border-ink/15 bg-white p-3"><I className="h-5 w-5 shrink-0 text-purple" />{t}</div>
            ))}
          </div>

          <div className="mt-8 divide-y-[3px] divide-ink overflow-hidden rounded-[1.5rem] border-[3px] border-ink bg-white">
            <Accordion title="The story" open><p className="whitespace-pre-line">{p.description}</p></Accordion>
            <Accordion title="Ingredients"><p>{p.ingredients}</p></Accordion>
            <Accordion title="Nutrition (per pop)">
              <p className="mb-2 text-xs text-muted">Per {p.weight?.replace(' per pop', '') || 'pop'}</p>
              <table className="w-full text-sm"><tbody>{p.nutrition?.map((n) => <tr key={n.label} className="border-b border-ink/10 last:border-0"><td className="py-2 font-semibold">{n.label}</td><td className="py-2 text-right font-bold">{n.value}</td></tr>)}</tbody></table>
            </Accordion>
            <Accordion title="Allergens"><p>{p.allergens}</p></Accordion>
            <Accordion title="Storage"><p>{p.storage}</p></Accordion>
            <Accordion title="Shipping & delivery">
              <p>Packed in an insulated cold-chain box with dry ice. Standard delivery in 2–4 working days{shipping ? ` — ${inr(shipping.standard)}, free above ${inr(shipping.freeThreshold)}` : ''}. Express next-day in select metros{shipping ? ` — ${inr(shipping.express)}` : ''}. <Link to="/shipping" className="font-bold underline">Full shipping policy</Link></p>
            </Accordion>
          </div>
        </div>
      </section>

      {fbt?.length > 0 && <FrequentlyBought product={p} variant={variant} others={fbt} />}
      <Reviews product={p} />
      {related?.length > 0 && (
        <section className="container-pop mt-20">
          <h2 className="display text-5xl text-grape md:text-6xl">MORE POPS <span className="hand text-4xl text-purple">you'll love</span></h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{related.map((r, i) => <ProductCard key={r._id} product={r} index={i} tilt={i % 2 ? 1 : -1} />)}</div>
        </section>
      )}

      {/* sticky mobile add-to-cart */}
      <motion.div initial={false} animate={{ y: showSticky ? 0 : 140 }} aria-hidden={!showSticky} className="fixed inset-x-0 bottom-0 z-40 border-t-[3px] border-ink bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border-2 border-ink" style={{ background: gradient(c) }}><ProductImage product={p} className="h-10 w-auto" /></div>
              <div className="min-w-0 flex-1"><p className="truncate font-display font-extrabold leading-tight">{p.name}</p><p className="text-sm font-bold">{inr(variant.price)} <span className="text-xs text-muted">· {variant.name}</span></p></div>
              <button ref={stickyRef} onClick={() => add(stickyRef.current)} disabled={soldOut || busy} className="btn btn-primary">{soldOut ? 'Sold out' : 'Add'}</button>
            </div>
      </motion.div>
    </div>
  );
}

function Accordion({ title, children, open: initial = false }) {
  const [open, setOpen] = useState(initial);
  return (
    <div>
      <button onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-center justify-between px-5 py-4 text-left font-display text-lg font-extrabold uppercase text-grape hover:bg-cream">
        {title}<ChevronDown className={`h-5 w-5 transition ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden"><div className="px-5 pb-5 text-[15px] leading-relaxed text-ink/80">{children}</div></motion.div>}
      </AnimatePresence>
    </div>
  );
}

function FrequentlyBought({ product, variant, others }) {
  const { addProduct } = useCart();
  const btn = useRef(null);
  const items = [{ p: product, v: variant }, ...others.map((o) => ({ p: o, v: o.variants.find((v) => v.isDefault) || o.variants[0] }))].filter((x) => x.v && x.v.available > 0);
  const [on, setOn] = useState(() => items.map(() => true));
  const total = items.reduce((a, x, i) => a + (on[i] ? x.v.price : 0), 0);
  const addAll = async () => {
    for (const [i, x] of items.entries()) if (on[i]) { try { await addProduct(x.p, x.v, 1, i === 0 ? btn.current : null, { openDrawer: i === items.length - 1 }); } catch { return; } }
  };
  if (items.length < 2) return null;
  return (
    <section className="container-pop mt-20">
      <div className="rounded-[2rem] border-[3px] border-ink bg-lemon p-6 shadow-[6px_6px_0_#1c0a3d] md:p-8">
        <h2 className="display text-4xl text-grape md:text-5xl">FREQUENTLY POPPED TOGETHER</h2>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          {items.map((x, i) => (
            <div key={x.p._id} className="flex items-center gap-4">
              {i > 0 && <Plus className="h-6 w-6" strokeWidth={3} />}
              <label className={`flex cursor-pointer items-center gap-3 rounded-2xl border-[3px] border-ink bg-white p-3 transition ${on[i] ? '' : 'opacity-50'}`}>
                <input type="checkbox" checked={on[i]} onChange={() => setOn(on.map((b, j) => (j === i ? !b : b)))} className="h-5 w-5 accent-pink" />
                <span className="grid h-14 w-14 place-items-center rounded-xl" style={{ background: gradient(colorsFor(x.p)) }}><ProductImage product={x.p} className="h-12 w-auto" /></span>
                <span><span className="block font-display font-extrabold">{x.p.name}</span><span className="text-sm font-bold">{inr(x.v.price)} · {x.v.name}</span></span>
              </label>
            </div>
          ))}
          <div className="ml-auto flex items-center gap-4">
            <p className="font-display text-2xl font-extrabold">Total {inr(total)}</p>
            <button ref={btn} onClick={addAll} disabled={!total} className="btn btn-dark">Add selected</button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Reviews({ product }) {
  const { user } = useAuth();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const { data, reload } = useFetch(`/reviews${qs({ product: product._id, page, limit: 6 })}`, { ttl: 0 });
  const [form, setForm] = useState({ rating: 5, title: '', body: '', images: [] });
  const [writing, setWriting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const photos = (data?.reviews || []).flatMap((r) => r.images || []);

  const upload = async (files) => {
    if (!files?.length) return;
    const fd = new FormData();
    [...files].slice(0, 3 - form.images.length).forEach((f) => fd.append('images', f));
    setUploading(true);
    try { const r = await api.post('/reviews/images', fd); setForm((f) => ({ ...f, images: [...f.images, ...r.urls].slice(0, 3) })); } catch (e) { toast.error(e.message); } finally { setUploading(false); }
  };
  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await api.post('/reviews', { productId: product._id, ...form });
      toast.success(r.message);
      setForm({ rating: 5, title: '', body: '', images: [] });
      setWriting(false);
      invalidate('/reviews');
      reload();
    } catch (err) { toast.error(err.message); } finally { setSaving(false); }
  };

  return (
    <section id="reviews" className="container-pop mt-20 scroll-mt-28">
      <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
        <div>
          <h2 className="display text-5xl text-grape">REVIEWS</h2>
          <div className="mt-4 flex items-baseline gap-3"><span className="display text-6xl">{product.ratingAvg?.toFixed(1)}</span><Stars value={product.ratingAvg} size={20} /></div>
          <p className="text-sm font-semibold text-muted">{product.ratingCount} review{product.ratingCount === 1 ? '' : 's'}</p>
          <div className="mt-4 space-y-1.5">
            {data?.distribution?.map((d) => (
              <div key={d.rating} className="flex items-center gap-2 text-sm font-bold"><span className="w-6">{d.rating}★</span><div className="h-3 flex-1 overflow-hidden rounded-full border-2 border-ink bg-white"><div className="h-full bg-pink" style={{ width: `${product.ratingCount ? (d.count / Math.max(1, data.total)) * 100 : 0}%` }} /></div><span className="w-6 text-right">{d.count}</span></div>
            ))}
          </div>
          {user ? <button onClick={() => setWriting(!writing)} className="btn btn-primary mt-6 w-full">{writing ? 'Close' : 'Write a review'}</button> : <Link to={`/login?next=/product/${product.slug}%23reviews`} className="btn btn-light mt-6 w-full">Log in to review</Link>}
          {photos.length > 0 && (
            <div className="mt-8">
              <p className="label">Customer photos</p>
              <div className="grid grid-cols-3 gap-2">{photos.slice(0, 9).map((u) => <a key={u} href={assetUrl(u)} target="_blank" rel="noreferrer"><img src={assetUrl(u)} alt="Customer photo" loading="lazy" className="aspect-square w-full rounded-xl border-2 border-ink object-cover" /></a>)}</div>
            </div>
          )}
        </div>
        <div>
          <AnimatePresence>
            {writing && (
              <motion.form onSubmit={submit} initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mb-6 overflow-hidden">
                <div className="space-y-4 rounded-[1.5rem] border-[3px] border-ink bg-white p-5">
                  <div><p className="label">Your rating</p><div className="flex gap-1">{[1, 2, 3, 4, 5].map((n) => <button type="button" key={n} onClick={() => setForm({ ...form, rating: n })} aria-label={`${n} stars`} className={`text-3xl transition hover:scale-125 ${n <= form.rating ? '' : 'opacity-25 grayscale'}`}>⭐</button>)}</div></div>
                  <input className="input" placeholder="Headline (e.g. Kala Khatta is insane)" maxLength={100} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                  <textarea className="input min-h-28" placeholder="Tell us everything…" required minLength={5} maxLength={1500} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
                  <div className="flex flex-wrap items-center gap-3">
                    {form.images.map((u) => <img key={u} src={assetUrl(u)} alt="" className="h-16 w-16 rounded-xl border-2 border-ink object-cover" />)}
                    {form.images.length < 3 && <label className="btn btn-sm btn-light cursor-pointer">{uploading ? <Spinner className="h-4 w-4" /> : <Camera className="h-4 w-4" />} Add photos<input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => upload(e.target.files)} /></label>}
                  </div>
                  <button disabled={saving} className="btn btn-dark">{saving ? <Spinner /> : 'Submit review'}</button>
                  <p className="text-xs text-muted">Reviews are checked by our team before they go live.</p>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
          {!data?.reviews?.length && <p className="rounded-2xl border-[3px] border-dashed border-ink/30 p-8 text-center font-bold text-muted">No reviews yet. Be the first to spill the tea.</p>}
          <div className="grid gap-4 md:grid-cols-2">
            {data?.reviews?.map((r, i) => (
              <article key={r._id} className={`rounded-[1.5rem] border-[3px] border-ink bg-white p-5 ${i % 2 ? 'md:rotate-[0.6deg]' : 'md:-rotate-[0.6deg]'}`}>
                <div className="flex items-center justify-between"><Stars value={r.rating} /><span className="text-xs font-semibold text-muted">{fmtDate(r.createdAt)}</span></div>
                {r.title && <h3 className="mt-2 font-display text-xl font-extrabold">{r.title}</h3>}
                <p className="mt-1 text-sm text-ink/80">{r.body}</p>
                {r.images?.length > 0 && <div className="mt-3 flex gap-2">{r.images.map((u) => <img key={u} src={assetUrl(u)} alt="Review photo" loading="lazy" className="h-16 w-16 rounded-xl border-2 border-ink object-cover" />)}</div>}
                <p className="mt-3 flex items-center gap-1 text-xs font-extrabold">{r.authorName}{r.isVerifiedPurchase && <><BadgeCheck className="h-4 w-4 text-purple" /> Verified buyer</>}{r.isSample && <span className="ml-2 rounded-full border border-ink/20 px-2 text-[10px] font-bold uppercase text-ink/40">sample</span>}</p>
              </article>
            ))}
          </div>
          {data?.pages > 1 && (
            <div className="mt-6 flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="btn btn-sm btn-light">Prev</button>
              <button disabled={page >= data.pages} onClick={() => setPage(page + 1)} className="btn btn-sm btn-light">Next</button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
