import { useEffect, useState } from 'react';
import { Plus, Trash2, Upload, ArrowUp, ArrowDown } from 'lucide-react';
import { PageHeader, Panel, Toggle } from './ui';
import Field from '../../components/ui/Field';
import Spinner, { PageSpinner } from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';
import { api, assetUrl } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useSettings } from '../../context/SettingsContext';
import { useFetch } from '../../hooks/useFetch';

const TABS = [['home', 'Homepage'], ['social', 'Social & feed'], ['pages', 'Pages'], ['footer', 'Footer & SEO'], ['banners', 'Banners'], ['faqs', 'FAQs']];

function ImageInput({ value, onChange, label = 'Image' }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const up = async (file) => {
    if (!file) return;
    const fd = new FormData(); fd.append('images', file);
    setBusy(true);
    try { const r = await api.post('/admin/uploads?folder=cms', fd); onChange(r.images[0].url); } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };
  return (
    <Field label={label}>
      <div className="flex items-center gap-2">
        {value && <img src={assetUrl(value)} alt="" className="h-11 w-11 shrink-0 rounded-lg border-2 border-ink object-cover" />}
        <input className="input py-2" value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder="/images/… or https://…" />
        <label className="btn btn-sm btn-light shrink-0 cursor-pointer">{busy ? <Spinner className="h-4 w-4" /> : <Upload className="h-4 w-4" />}<input type="file" accept="image/*" className="sr-only" onChange={(e) => up(e.target.files?.[0])} /></label>
      </div>
    </Field>
  );
}

function ListEditor({ items, onChange, make, render, addLabel = 'Add' }) {
  const move = (i, d) => { const a = [...items]; const j = i + d; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; onChange(a); };
  return (
    <div className="space-y-3">
      {items.map((it, i) => (
        <div key={i} className="relative rounded-2xl bg-cream p-4 pr-14">
          {render(it, (patch) => onChange(items.map((x, j) => (j === i ? { ...x, ...patch } : x))))}
          <div className="absolute right-2 top-2 flex flex-col gap-1">
            <button type="button" onClick={() => move(i, -1)} aria-label="Move up" className="grid h-8 w-8 place-items-center rounded-full bg-white"><ArrowUp className="h-4 w-4" /></button>
            <button type="button" onClick={() => move(i, 1)} aria-label="Move down" className="grid h-8 w-8 place-items-center rounded-full bg-white"><ArrowDown className="h-4 w-4" /></button>
            <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} aria-label="Remove" className="grid h-8 w-8 place-items-center rounded-full bg-white text-magenta"><Trash2 className="h-4 w-4" /></button>
          </div>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...items, make()])} className="btn btn-sm btn-light"><Plus className="h-4 w-4" /> {addLabel}</button>
    </div>
  );
}

export default function Cms() {
  const toast = useToast();
  const { setSettings } = useSettings();
  const [tab, setTab] = useState('home');
  const [s, setS] = useState(null);
  const [saving, setSaving] = useState(false);
  const products = useFetch('/admin/products?limit=100', { ttl: 0 });

  useEffect(() => { api.get('/admin/cms').then((r) => setS(r.settings)).catch((e) => toast.error(e.message)); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  if (!s) return <PageSpinner />;
  const set = (patch) => setS((x) => ({ ...x, ...patch }));
  const plist = products.data?.products || [];

  const save = async () => {
    setSaving(true);
    try {
      const body = { ...s, flavourCards: (s.flavourCards || []).filter((c) => c.product).map((c) => ({ ...c, product: c.product?._id || c.product })), featuredProducts: (s.featuredProducts || []).map((p) => p?._id || p) };
      ['_id', '__v', 'key', 'createdAt', 'updatedAt'].forEach((k) => delete body[k]);
      const r = await api.put('/admin/cms', body);
      setS(r.settings);
      const pub = await api.get('/content/settings');
      setSettings(pub.settings);
      toast.success('Storefront updated ✨');
    } catch (e) { toast.error(e.message); } finally { setSaving(false); }
  };

  const saveBar = !['banners', 'faqs'].includes(tab) && <button onClick={save} disabled={saving} className="btn btn-primary">{saving ? <Spinner /> : 'Publish changes'}</button>;
  const hero = s.hero || {};
  return (
    <div className="space-y-6">
      <PageHeader title="CONTENT / CMS" sub="Everything customers see on the homepage and info pages.">{saveBar}</PageHeader>
      <div className="no-scrollbar flex gap-2 overflow-x-auto" role="tablist">{TABS.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`shrink-0 rounded-full border-[3px] border-ink px-4 py-2 text-sm font-extrabold uppercase ${tab === k ? 'bg-ink text-white' : 'bg-white'}`}>{l}</button>)}</div>

      {tab === 'home' && (
        <div className="grid gap-6 xl:grid-cols-2">
          <Panel title="Announcement bar"><input className="input" value={s.announcement || ''} onChange={(e) => set({ announcement: e.target.value })} placeholder="Leave empty to hide" /></Panel>
          <Panel title="Marquee words"><input className="input" value={(s.marquee || []).join(', ')} onChange={(e) => set({ marquee: e.target.value.split(',').map((x) => x.trim()).filter(Boolean) })} /><p className="mt-1 text-xs text-muted">Comma separated</p></Panel>
          <Panel title="Hero" className="xl:col-span-2">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Eyebrow sticker"><input className="input" value={hero.eyebrow || ''} onChange={(e) => set({ hero: { ...hero, eyebrow: e.target.value } })} /></Field>
              <Field label="Headline lines (one per line)"><textarea className="input min-h-24 font-display font-extrabold uppercase" value={(hero.headline || []).join('\n')} onChange={(e) => set({ hero: { ...hero, headline: e.target.value.split('\n').slice(0, 4) } })} /></Field>
              <Field label="Subheading" className="md:col-span-2"><input className="input" value={hero.subheading || ''} onChange={(e) => set({ hero: { ...hero, subheading: e.target.value } })} /></Field>
              <Field label="Primary button text"><input className="input" value={hero.ctaPrimary?.text || ''} onChange={(e) => set({ hero: { ...hero, ctaPrimary: { ...hero.ctaPrimary, text: e.target.value } } })} /></Field>
              <Field label="Primary button link"><input className="input" value={hero.ctaPrimary?.link || ''} onChange={(e) => set({ hero: { ...hero, ctaPrimary: { ...hero.ctaPrimary, link: e.target.value } } })} /></Field>
              <Field label="Secondary button text"><input className="input" value={hero.ctaSecondary?.text || ''} onChange={(e) => set({ hero: { ...hero, ctaSecondary: { ...hero.ctaSecondary, text: e.target.value } } })} /></Field>
              <Field label="Secondary button link"><input className="input" value={hero.ctaSecondary?.link || ''} onChange={(e) => set({ hero: { ...hero, ctaSecondary: { ...hero.ctaSecondary, link: e.target.value } } })} /></Field>
              <div className="md:col-span-2"><ImageInput label="Hero photo" value={hero.image} onChange={(v) => set({ hero: { ...hero, image: v } })} /></div>
            </div>
          </Panel>
          <Panel title="Flavour cards (“Pick your pop”)" className="xl:col-span-2">
            <div className="mb-4 grid gap-4 md:grid-cols-2">
              <Field label="Section heading"><input className="input" value={s.flavourSection?.heading || ''} onChange={(e) => set({ flavourSection: { ...s.flavourSection, heading: e.target.value } })} /></Field>
              <Field label="Handwritten subtitle"><input className="input" value={s.flavourSection?.subheading || ''} onChange={(e) => set({ flavourSection: { ...s.flavourSection, subheading: e.target.value } })} /></Field>
            </div>
            <ListEditor items={s.flavourCards || []} onChange={(v) => set({ flavourCards: v })} addLabel="Add card" make={() => ({ product: plist[0]?._id, title: '', tagline: '', from: '#FF4FB8', to: '#7B2FF7', image: '' })}
              render={(c, upd) => (
                <div className="grid gap-3 md:grid-cols-3">
                  <Field label="Product"><select className="input py-2" value={c.product?._id || c.product || ''} onChange={(e) => upd({ product: e.target.value })}>{plist.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}</select></Field>
                  <Field label="Title"><input className="input py-2" value={c.title || ''} onChange={(e) => upd({ title: e.target.value })} /></Field>
                  <Field label="Tagline"><input className="input py-2" value={c.tagline || ''} onChange={(e) => upd({ tagline: e.target.value })} /></Field>
                  <Field label="From"><input type="color" className="h-10 w-full rounded-lg border-2 border-ink" value={c.from || '#ffffff'} onChange={(e) => upd({ from: e.target.value })} /></Field>
                  <Field label="To"><input type="color" className="h-10 w-full rounded-lg border-2 border-ink" value={c.to || '#ffffff'} onChange={(e) => upd({ to: e.target.value })} /></Field>
                  <ImageInput value={c.image} onChange={(v) => upd({ image: v })} />
                </div>
              )} />
          </Panel>
          <Panel title="“Meet the pops” products">
            <div className="grid grid-cols-2 gap-2">{plist.map((p) => { const ids = (s.featuredProducts || []).map((x) => x?._id || x); const on = ids.includes(p._id); return <label key={p._id} className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={on} onChange={() => set({ featuredProducts: on ? ids.filter((x) => x !== p._id) : [...ids, p._id] })} className="h-4 w-4" />{p.name}</label>; })}</div>
            <p className="mt-2 text-xs text-muted">First four are shown, in the order ticked.</p>
          </Panel>
          <Panel title="Build-your-box pricing">
            <div className="space-y-2">{(s.boxes || []).map((b, i) => (
              <div key={i} className="grid grid-cols-4 gap-2">
                <Field label="Pops"><input className="input py-2 bg-cream" value={b.size} readOnly /></Field>
                <Field label="Name"><input className="input py-2" value={b.label || ''} onChange={(e) => set({ boxes: s.boxes.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} /></Field>
                <Field label="Price ₹"><input className="input py-2" type="number" min={1} value={b.price} onChange={(e) => set({ boxes: s.boxes.map((x, j) => (j === i ? { ...x, price: Number(e.target.value) } : x)) })} /></Field>
                <Field label="MRP ₹"><input className="input py-2" type="number" min={1} value={b.mrp} onChange={(e) => set({ boxes: s.boxes.map((x, j) => (j === i ? { ...x, mrp: Number(e.target.value) } : x)) })} /></Field>
              </div>
            ))}</div>
          </Panel>
          <Panel title="Shop-by-mood cards" className="xl:col-span-2">
            <ListEditor items={s.moods || []} onChange={(v) => set({ moods: v })} addLabel="Add mood" make={() => ({ key: 'new-mood', title: 'NEW', subtitle: '', from: '#26C6FF', to: '#7B2FF7', emoji: '🍭' })}
              render={(m, upd) => (
                <div className="grid gap-3 md:grid-cols-6">
                  <Field label="Key (filter tag)"><input className="input py-2" value={m.key} onChange={(e) => upd({ key: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })} /></Field>
                  <Field label="Title"><input className="input py-2" value={m.title} onChange={(e) => upd({ title: e.target.value })} /></Field>
                  <Field label="Subtitle" className="md:col-span-2"><input className="input py-2" value={m.subtitle} onChange={(e) => upd({ subtitle: e.target.value })} /></Field>
                  <Field label="Emoji"><input className="input py-2" value={m.emoji} onChange={(e) => upd({ emoji: e.target.value })} /></Field>
                  <div className="flex gap-2"><Field label="From"><input type="color" className="h-10 w-14 rounded-lg border-2 border-ink" value={m.from} onChange={(e) => upd({ from: e.target.value })} /></Field><Field label="To"><input type="color" className="h-10 w-14 rounded-lg border-2 border-ink" value={m.to} onChange={(e) => upd({ to: e.target.value })} /></Field></div>
                </div>
              )} />
            <p className="mt-2 text-xs text-muted">Products appear under a mood when their “Moods” include the key (edit on each product).</p>
          </Panel>
        </div>
      )}

      {tab === 'social' && (
        <div className="grid gap-6 xl:grid-cols-[1fr_1.6fr]">
          <Panel title="Social links">
            <div className="space-y-3">{['instagram', 'tiktok', 'youtube'].map((k) => <Field key={k} label={k}><input className="input" type="url" value={s.socials?.[k] || ''} onChange={(e) => set({ socials: { ...s.socials, [k]: e.target.value } })} /></Field>)}</div>
          </Panel>
          <Panel title="“POPSYY IRL” feed">
            <ListEditor items={s.socialFeed || []} onChange={(v) => set({ socialFeed: v })} addLabel="Add post" make={() => ({ image: '', caption: '', handle: '@popsyy.in', platform: 'instagram', link: '' })}
              render={(f, upd) => (
                <div className="grid gap-3 md:grid-cols-2">
                  <ImageInput value={f.image} onChange={(v) => upd({ image: v })} />
                  <Field label="Caption"><input className="input py-2" value={f.caption} onChange={(e) => upd({ caption: e.target.value })} /></Field>
                  <Field label="Handle"><input className="input py-2" value={f.handle} onChange={(e) => upd({ handle: e.target.value })} /></Field>
                  <div className="grid grid-cols-2 gap-2"><Field label="Platform"><select className="input py-2" value={f.platform} onChange={(e) => upd({ platform: e.target.value })}><option value="instagram">Instagram</option><option value="tiktok">TikTok</option></select></Field><Field label="Post link"><input className="input py-2" value={f.link} onChange={(e) => upd({ link: e.target.value })} /></Field></div>
                </div>
              )} />
          </Panel>
        </div>
      )}

      {tab === 'pages' && (
        <div className="grid gap-6 xl:grid-cols-2">
          <Panel title="About page" className="xl:col-span-2">
            <Field label="Heading"><input className="input" value={s.about?.heading || ''} onChange={(e) => set({ about: { ...s.about, heading: e.target.value } })} /></Field>
            <Field label="Story (blank line = new paragraph)" className="mt-3"><textarea className="input min-h-48" value={s.about?.body || ''} onChange={(e) => set({ about: { ...s.about, body: e.target.value } })} /></Field>
          </Panel>
          {['shipping', 'returns', 'privacy', 'terms'].map((k) => (
            <Panel key={k} title={`${k} page`}><textarea className="input min-h-48" value={s.pages?.[k] || ''} onChange={(e) => set({ pages: { ...s.pages, [k]: e.target.value } })} /></Panel>
          ))}
        </div>
      )}

      {tab === 'footer' && (
        <div className="grid gap-6 xl:grid-cols-2">
          <Panel title="Footer">
            <div className="space-y-3">{[['tagline', 'Tagline'], ['email', 'Support email'], ['phone', 'Phone'], ['address', 'Address']].map(([k, l]) => <Field key={k} label={l}><input className="input" value={s.footer?.[k] || ''} onChange={(e) => set({ footer: { ...s.footer, [k]: e.target.value } })} /></Field>)}</div>
          </Panel>
          <Panel title="Default SEO">
            <div className="space-y-3">
              <Field label="Homepage title"><input className="input" value={s.seo?.title || ''} onChange={(e) => set({ seo: { ...s.seo, title: e.target.value } })} /></Field>
              <Field label="Meta description"><textarea className="input min-h-24" value={s.seo?.description || ''} onChange={(e) => set({ seo: { ...s.seo, description: e.target.value } })} /></Field>
              <ImageInput label="Social share image" value={s.seo?.ogImage} onChange={(v) => set({ seo: { ...s.seo, ogImage: v } })} />
            </div>
          </Panel>
        </div>
      )}

      {tab === 'banners' && <Banners ImageInput={ImageInput} />}
      {tab === 'faqs' && <Faqs />}
    </div>
  );
}

function Banners({ ImageInput }) {
  const toast = useToast();
  const { data, reload } = useFetch('/admin/banners', { ttl: 0 });
  const [edit, setEdit] = useState(null);
  const save = async (e) => {
    e.preventDefault();
    const { _id, __v, createdAt, updatedAt, ...body } = edit; // eslint-disable-line no-unused-vars
    ['startsAt', 'endsAt'].forEach((k) => { if (!body[k]) body[k] = null; });
    try { if (_id) await api.put(`/admin/banners/${_id}`, body); else await api.post('/admin/banners', body); setEdit(null); reload(); toast.success('Banner saved'); } catch (err) { toast.error(err.message); }
  };
  const del = async (b) => { if (!window.confirm('Delete banner?')) return; await api.del(`/admin/banners/${b._id}`).catch((e) => toast.error(e.message)); reload(); };
  return (
    <Panel title="Promo banners" action={<button onClick={() => setEdit({ title: '', subtitle: '', ctaText: 'SHOP NOW', ctaLink: '/shop', image: '', colorFrom: '#FF2E93', colorTo: '#FF8A00', placement: 'home_promo', isActive: true, sortOrder: 0 })} className="btn btn-sm btn-primary"><Plus className="h-4 w-4" /> New banner</button>}>
      <div className="space-y-3">{data?.banners.map((b) => (
        <div key={b._id} className="flex flex-wrap items-center gap-3 rounded-2xl border-[3px] border-ink p-4 text-white" style={{ background: `linear-gradient(120deg, ${b.colorFrom}, ${b.colorTo})` }}>
          <div className="flex-1"><p className="font-display text-xl font-extrabold">{b.title}</p><p className="text-sm">{b.subtitle}</p><p className="text-xs opacity-80">{b.placement} · {b.isActive ? 'active' : 'hidden'}</p></div>
          <button onClick={() => setEdit({ ...b, startsAt: b.startsAt?.slice(0, 10) || '', endsAt: b.endsAt?.slice(0, 10) || '' })} className="btn btn-sm btn-light">Edit</button><button onClick={() => del(b)} className="btn btn-sm btn-light text-magenta"><Trash2 className="h-4 w-4" /></button>
        </div>
      ))}{data && !data.banners.length && <p className="text-sm text-muted">No banners.</p>}</div>
      <Modal open={Boolean(edit)} onClose={() => setEdit(null)} title="Banner" wide>
        {edit && (
          <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
            <Field label="Title"><input className="input" required value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} /></Field>
            <Field label="Subtitle"><input className="input" value={edit.subtitle} onChange={(e) => setEdit({ ...edit, subtitle: e.target.value })} /></Field>
            <Field label="Button text"><input className="input" value={edit.ctaText} onChange={(e) => setEdit({ ...edit, ctaText: e.target.value })} /></Field>
            <Field label="Button link"><input className="input" value={edit.ctaLink} onChange={(e) => setEdit({ ...edit, ctaLink: e.target.value })} /></Field>
            <Field label="Colour from"><input type="color" className="h-11 w-full rounded-xl border-[3px] border-ink" value={edit.colorFrom} onChange={(e) => setEdit({ ...edit, colorFrom: e.target.value })} /></Field>
            <Field label="Colour to"><input type="color" className="h-11 w-full rounded-xl border-[3px] border-ink" value={edit.colorTo} onChange={(e) => setEdit({ ...edit, colorTo: e.target.value })} /></Field>
            <Field label="Starts (optional)"><input type="date" className="input" value={edit.startsAt || ''} onChange={(e) => setEdit({ ...edit, startsAt: e.target.value })} /></Field>
            <Field label="Ends (optional)"><input type="date" className="input" value={edit.endsAt || ''} onChange={(e) => setEdit({ ...edit, endsAt: e.target.value })} /></Field>
            <div className="sm:col-span-2"><ImageInput value={edit.image} onChange={(v) => setEdit({ ...edit, image: v })} label="Background image (optional)" /></div>
            <Toggle checked={edit.isActive} onChange={(v) => setEdit({ ...edit, isActive: v })} label="Active" />
            <button className="btn btn-primary sm:col-span-2">Save banner</button>
          </form>
        )}
      </Modal>
    </Panel>
  );
}

function Faqs() {
  const toast = useToast();
  const { data, reload } = useFetch('/admin/faqs', { ttl: 0 });
  const [edit, setEdit] = useState(null);
  const save = async (e) => {
    e.preventDefault();
    const body = { question: edit.question, answer: edit.answer, category: edit.category, sortOrder: Number(edit.sortOrder || 0), isActive: edit.isActive };
    try { if (edit._id) await api.put(`/admin/faqs/${edit._id}`, body); else await api.post('/admin/faqs', body); setEdit(null); reload(); toast.success('FAQ saved'); } catch (err) { toast.error(err.message); }
  };
  const del = async (f) => { if (!window.confirm('Delete FAQ?')) return; await api.del(`/admin/faqs/${f._id}`).catch((e) => toast.error(e.message)); reload(); };
  return (
    <Panel title="FAQs" action={<button onClick={() => setEdit({ question: '', answer: '', category: 'General', sortOrder: (data?.faqs.length || 0) + 1, isActive: true })} className="btn btn-sm btn-primary"><Plus className="h-4 w-4" /> New FAQ</button>}>
      <div className="divide-y divide-ink/10">{data?.faqs.map((f) => (
        <div key={f._id} className="flex items-start gap-3 py-3"><div className="flex-1"><p className="font-bold">{f.question} {!f.isActive && <span className="text-xs text-muted">(hidden)</span>}</p><p className="text-sm text-muted">{f.answer}</p></div><button onClick={() => setEdit(f)} className="btn btn-sm btn-light">Edit</button><button onClick={() => del(f)} className="btn btn-sm btn-light text-magenta"><Trash2 className="h-4 w-4" /></button></div>
      ))}</div>
      <Modal open={Boolean(edit)} onClose={() => setEdit(null)} title="FAQ">
        {edit && (
          <form onSubmit={save} className="space-y-3">
            <Field label="Question"><input className="input" required minLength={3} value={edit.question} onChange={(e) => setEdit({ ...edit, question: e.target.value })} /></Field>
            <Field label="Answer"><textarea className="input min-h-28" required minLength={3} value={edit.answer} onChange={(e) => setEdit({ ...edit, answer: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3"><Field label="Category"><input className="input" value={edit.category} onChange={(e) => setEdit({ ...edit, category: e.target.value })} /></Field><Field label="Order"><input className="input" type="number" value={edit.sortOrder} onChange={(e) => setEdit({ ...edit, sortOrder: e.target.value })} /></Field></div>
            <Toggle checked={edit.isActive} onChange={(v) => setEdit({ ...edit, isActive: v })} label="Visible" />
            <button className="btn btn-primary w-full">Save FAQ</button>
          </form>
        )}
      </Modal>
    </Panel>
  );
}
