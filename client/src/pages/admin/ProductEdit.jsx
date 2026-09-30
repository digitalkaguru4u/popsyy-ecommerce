import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Upload, ArrowUp, ArrowDown, Star } from 'lucide-react';
import { PageHeader, Panel, Toggle } from './ui';
import Field from '../../components/ui/Field';
import Spinner, { PageSpinner } from '../../components/ui/Spinner';
import { api, assetUrl } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { invalidate } from '../../hooks/useFetch';
import { slugify } from './slug';

const MOODS = ['chill', 'party', 'study-break', 'summer', 'desi-mode'];
const blank = {
  name: '', slug: '', flavour: '', tagline: '', shortDescription: '', description: '', colors: { from: '#FF4FB8', to: '#7B2FF7', ink: '#1C0A3D' },
  images: [], stock: 0, lowStockThreshold: 50, weight: '60 ml per pop', ingredients: '', nutrition: [{ label: 'Energy', value: '' }], allergens: '', storage: 'Keep frozen at –18°C or below.',
  moods: [], isActive: true, isFeatured: false, isBestseller: false, isNewArrival: true, sortOrder: 10, seo: { title: '', description: '' },
  variants: [{ name: 'Pack of 6', packSize: 6, sku: '', price: 199, mrp: 240, isDefault: true, isActive: true }],
};

export default function ProductEdit() {
  const { id } = useParams();
  const isNew = !id;
  const nav = useNavigate();
  const toast = useToast();
  const [f, setF] = useState(isNew ? blank : null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [slugTouched, setSlugTouched] = useState(!isNew);

  useEffect(() => {
    if (isNew) return;
    api.get(`/admin/products/${id}`).then((r) => {
      const p = r.product;
      setF({ ...blank, ...p, colors: { ...blank.colors, ...p.colors }, seo: { ...blank.seo, ...p.seo }, variants: p.variants.map(({ _id, name, packSize, sku, price, mrp, isDefault, isActive }) => ({ _id, name, packSize, sku, price, mrp, isDefault, isActive })) });
    }).catch((e) => toast.error(e.message));
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!f) return <PageSpinner />;
  const set = (patch) => setF((x) => ({ ...x, ...patch }));
  const setVar = (i, patch) => set({ variants: f.variants.map((v, j) => (j === i ? { ...v, ...patch } : patch.isDefault ? { ...v, isDefault: false } : v)) });

  const upload = async (files) => {
    if (!files?.length) return;
    const fd = new FormData();
    [...files].forEach((file) => fd.append('images', file));
    setUploading(true);
    try { const r = await api.post('/admin/uploads', fd); set({ images: [...f.images, ...r.images.map((i) => ({ url: i.url, publicId: i.publicId, alt: `POPSYY ${f.name} ice pop` }))] }); toast.success('Uploaded'); } catch (e) { toast.error(e.message); } finally { setUploading(false); }
  };
  const moveImg = (i, d) => { const imgs = [...f.images]; const j = i + d; if (j < 0 || j >= imgs.length) return; [imgs[i], imgs[j]] = [imgs[j], imgs[i]]; set({ images: imgs }); };
  const removeImg = async (i) => { const img = f.images[i]; set({ images: f.images.filter((_, j) => j !== i) }); if (img.publicId) api.post('/admin/uploads/delete', { publicId: img.publicId }).catch(() => {}); };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    const body = {
      name: f.name, slug: f.slug || slugify(f.name), flavour: slugify(f.flavour || f.name), tagline: f.tagline, shortDescription: f.shortDescription, description: f.description,
      colors: f.colors, images: f.images.map(({ url, alt, publicId }) => ({ url, alt: alt || '', publicId: publicId || '' })), stock: Number(f.stock), lowStockThreshold: Number(f.lowStockThreshold),
      weight: f.weight, ingredients: f.ingredients, nutrition: f.nutrition.filter((n) => n.label && n.value), allergens: f.allergens, storage: f.storage, moods: f.moods,
      isActive: f.isActive, isFeatured: f.isFeatured, isBestseller: f.isBestseller, isNewArrival: f.isNewArrival, sortOrder: Number(f.sortOrder), seo: f.seo,
      variants: f.variants.map((v) => ({ ...(v._id ? { _id: v._id } : {}), name: v.name, packSize: Number(v.packSize), sku: v.sku || `PSY-${slugify(f.name).slice(0, 6).toUpperCase()}-${v.packSize}`, price: Number(v.price), mrp: Number(v.mrp), isDefault: Boolean(v.isDefault), isActive: v.isActive !== false })),
    };
    try {
      const r = isNew ? await api.post('/admin/products', body) : await api.put(`/admin/products/${id}`, body);
      invalidate('/products');
      toast.success('Product saved');
      if (isNew) nav(`/admin/products/${r.product._id}`, { replace: true });
    } catch (err) { toast.error(err.message); } finally { setSaving(false); }
  };

  return (
    <form onSubmit={save} className="space-y-6">
      <Link to="/admin/products" className="inline-flex items-center gap-1 text-sm font-extrabold uppercase"><ArrowLeft className="h-4 w-4" /> Products</Link>
      <PageHeader title={isNew ? 'NEW PRODUCT' : f.name.toUpperCase()}>
        {!isNew && <a href={`/product/${f.slug}`} target="_blank" rel="noreferrer" className="btn btn-light btn-sm">View on store</a>}
        <button disabled={saving} className="btn btn-primary">{saving ? <Spinner /> : 'Save product'}</button>
      </PageHeader>
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Panel title="Basics">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name"><input className="input" required value={f.name} onChange={(e) => set({ name: e.target.value, ...(slugTouched ? {} : { slug: slugify(e.target.value), flavour: slugify(e.target.value) }) })} /></Field>
              <Field label="Slug (URL)" hint={`/product/${f.slug || '…'}`}><input className="input" value={f.slug} onChange={(e) => { setSlugTouched(true); set({ slug: slugify(e.target.value) }); }} /></Field>
              <Field label="Flavour key" hint="lowercase, used for filters & colours"><input className="input" required value={f.flavour} onChange={(e) => set({ flavour: e.target.value })} /></Field>
              <Field label="Tagline"><input className="input" value={f.tagline} onChange={(e) => set({ tagline: e.target.value })} /></Field>
              <Field label="Short description" className="sm:col-span-2"><textarea className="input min-h-20" maxLength={300} value={f.shortDescription} onChange={(e) => set({ shortDescription: e.target.value })} /></Field>
              <Field label="Full description" className="sm:col-span-2"><textarea className="input min-h-32" value={f.description} onChange={(e) => set({ description: e.target.value })} /></Field>
            </div>
          </Panel>
          <Panel title="Pack sizes & pricing" action={<button type="button" onClick={() => set({ variants: [...f.variants, { name: 'Pack of 12', packSize: 12, sku: '', price: 0, mrp: 0, isDefault: false, isActive: true }] })} className="btn btn-sm btn-light"><Plus className="h-4 w-4" /> Add pack</button>}>
            <div className="space-y-3">
              {f.variants.map((v, i) => (
                <div key={i} className="grid grid-cols-2 items-end gap-3 rounded-2xl bg-cream p-3 sm:grid-cols-3">
                  <Field label="Name"><input className="input py-2" required value={v.name} onChange={(e) => setVar(i, { name: e.target.value })} /></Field>
                  <Field label="Pops"><input className="input py-2" type="number" min={1} required value={v.packSize} onChange={(e) => setVar(i, { packSize: e.target.value })} /></Field>
                  <Field label="SKU"><input className="input py-2 uppercase" placeholder="auto" value={v.sku} onChange={(e) => setVar(i, { sku: e.target.value.toUpperCase() })} /></Field>
                  <Field label="Price ₹"><input className="input py-2" type="number" min={0} step="0.01" required value={v.price} onChange={(e) => setVar(i, { price: e.target.value })} /></Field>
                  <Field label="MRP ₹"><input className="input py-2" type="number" min={0} step="0.01" required value={v.mrp} onChange={(e) => setVar(i, { mrp: e.target.value })} /></Field>
                  <div className="flex items-center gap-1 pb-1">
                    <button type="button" onClick={() => setVar(i, { isDefault: true })} aria-label="Make default" title="Default (shown on cards)" className={`grid h-9 w-9 place-items-center rounded-full border-2 border-ink ${v.isDefault ? 'bg-lemon' : 'bg-white'}`}><Star className="h-4 w-4" /></button>
                    <button type="button" disabled={f.variants.length <= 1} onClick={() => set({ variants: f.variants.filter((_, j) => j !== i) })} aria-label="Remove pack" className="grid h-9 w-9 place-items-center rounded-full border-2 border-ink bg-white disabled:opacity-30"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted">Prices are GST-inclusive. Stock is shared across packs (a Pack of 12 uses 12 pops).</p>
          </Panel>
          <Panel title="Ingredients, nutrition & storage">
            <div className="grid gap-4">
              <Field label="Ingredients"><textarea className="input min-h-20" value={f.ingredients} onChange={(e) => set({ ingredients: e.target.value })} /></Field>
              <div>
                <p className="label">Nutrition (per pop)</p>
                <div className="space-y-2">
                  {f.nutrition.map((n, i) => (
                    <div key={i} className="flex gap-2">
                      <input className="input py-2" placeholder="Label" value={n.label} onChange={(e) => set({ nutrition: f.nutrition.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} />
                      <input className="input py-2" placeholder="Value" value={n.value} onChange={(e) => set({ nutrition: f.nutrition.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)) })} />
                      <button type="button" onClick={() => set({ nutrition: f.nutrition.filter((_, j) => j !== i) })} aria-label="Remove row" className="grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 border-ink"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  ))}
                  <button type="button" onClick={() => set({ nutrition: [...f.nutrition, { label: '', value: '' }] })} className="btn btn-sm btn-light"><Plus className="h-4 w-4" /> Row</button>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Weight / size"><input className="input" value={f.weight} onChange={(e) => set({ weight: e.target.value })} /></Field>
                <Field label="Allergens"><input className="input" value={f.allergens} onChange={(e) => set({ allergens: e.target.value })} /></Field>
              </div>
              <Field label="Storage"><textarea className="input min-h-16" value={f.storage} onChange={(e) => set({ storage: e.target.value })} /></Field>
            </div>
          </Panel>
        </div>
        <div className="space-y-6">
          <Panel title="Status">
            <div className="grid gap-3">
              <Toggle checked={f.isActive} onChange={(v) => set({ isActive: v })} label="Active (visible on store)" />
              <Toggle checked={f.isBestseller} onChange={(v) => set({ isBestseller: v })} label="🔥 Bestseller badge" />
              <Toggle checked={f.isNewArrival} onChange={(v) => set({ isNewArrival: v })} label="✨ New badge" />
              <Toggle checked={f.isFeatured} onChange={(v) => set({ isFeatured: v })} label="Featured" />
              <Field label="Sort order"><input className="input py-2" type="number" value={f.sortOrder} onChange={(e) => set({ sortOrder: e.target.value })} /></Field>
            </div>
          </Panel>
          <Panel title="Inventory">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Stock (pops)" hint={isNew ? 'Opening stock' : 'Changes are logged'}><input className="input" type="number" min={0} value={f.stock} onChange={(e) => set({ stock: e.target.value })} /></Field>
              <Field label="Low-stock alert at"><input className="input" type="number" min={0} value={f.lowStockThreshold} onChange={(e) => set({ lowStockThreshold: e.target.value })} /></Field>
            </div>
          </Panel>
          <Panel title="Images" action={<label className="btn btn-sm btn-light cursor-pointer">{uploading ? <Spinner className="h-4 w-4" /> : <Upload className="h-4 w-4" />} Upload<input type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif" multiple className="sr-only" onChange={(e) => upload(e.target.files)} /></label>}>
            <div className="grid grid-cols-3 gap-3">
              {f.images.map((img, i) => (
                <div key={img.url + i} className="relative overflow-hidden rounded-2xl border-2 border-ink" style={{ background: `linear-gradient(135deg, ${f.colors.from}, ${f.colors.to})` }}>
                  <img src={assetUrl(img.url)} alt={img.alt} className="aspect-square w-full object-contain p-2" />
                  {i === 0 && <span className="absolute left-1 top-1 rounded-full bg-lime px-2 text-[10px] font-extrabold">MAIN</span>}
                  <div className="absolute inset-x-1 bottom-1 flex justify-between">
                    <span className="flex gap-1"><button type="button" onClick={() => moveImg(i, -1)} aria-label="Move left" className="grid h-6 w-6 place-items-center rounded-full bg-white"><ArrowUp className="h-3 w-3 -rotate-90" /></button><button type="button" onClick={() => moveImg(i, 1)} aria-label="Move right" className="grid h-6 w-6 place-items-center rounded-full bg-white"><ArrowDown className="h-3 w-3 -rotate-90" /></button></span>
                    <button type="button" onClick={() => removeImg(i)} aria-label="Remove image" className="grid h-6 w-6 place-items-center rounded-full bg-white text-magenta"><Trash2 className="h-3 w-3" /></button>
                  </div>
                </div>
              ))}
            </div>
            <Field label="…or add image by URL / path" className="mt-3"><input className="input py-2" placeholder="/images/products/lemon-lime.svg" onKeyDown={(e) => { if (e.key === 'Enter' && e.target.value) { e.preventDefault(); set({ images: [...f.images, { url: e.target.value, alt: `POPSYY ${f.name}` }] }); e.target.value = ''; } }} /></Field>
          </Panel>
          <Panel title="Look & mood">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Gradient from"><input type="color" className="h-11 w-full cursor-pointer rounded-xl border-[3px] border-ink" value={f.colors.from} onChange={(e) => set({ colors: { ...f.colors, from: e.target.value } })} /></Field>
              <Field label="Gradient to"><input type="color" className="h-11 w-full cursor-pointer rounded-xl border-[3px] border-ink" value={f.colors.to} onChange={(e) => set({ colors: { ...f.colors, to: e.target.value } })} /></Field>
            </div>
            <p className="label mt-4">Moods</p>
            <div className="flex flex-wrap gap-2">{MOODS.map((m) => <button type="button" key={m} onClick={() => set({ moods: f.moods.includes(m) ? f.moods.filter((x) => x !== m) : [...f.moods, m] })} className={`chip ${f.moods.includes(m) ? 'bg-ink text-white' : ''}`}>{m}</button>)}</div>
          </Panel>
          <Panel title="SEO">
            <div className="grid gap-3">
              <Field label="Meta title"><input className="input py-2" maxLength={120} value={f.seo.title} onChange={(e) => set({ seo: { ...f.seo, title: e.target.value } })} /></Field>
              <Field label="Meta description"><textarea className="input min-h-20" maxLength={300} value={f.seo.description} onChange={(e) => set({ seo: { ...f.seo, description: e.target.value } })} /></Field>
            </div>
          </Panel>
        </div>
      </div>
    </form>
  );
}
