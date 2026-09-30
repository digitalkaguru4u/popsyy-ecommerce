import { useState } from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';
import Seo from '../components/ui/Seo';
import Field from '../components/ui/Field';
import Spinner from '../components/ui/Spinner';
import { api } from '../services/api';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';

export default function Contact() {
  const { settings } = useSettings();
  const toast = useToast();
  const f = settings?.footer || {};
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setLoading(true);
    try { const r = await api.post('/content/contact', form); toast.success(r.message); setSent(true); } catch (err) { toast.error(err.message); } finally { setLoading(false); }
  };
  return (
    <div className="container-pop py-8">
      <Seo title="Contact" description="Talk to the POPSYY team about orders, bulk & party orders, or collabs." path="/contact" />
      <h1 className="display text-6xl text-grape md:text-8xl">SAY <span className="text-pink">HI.</span></h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1.3fr]">
        <div className="space-y-4">
          {[[Mail, f.email, f.email && `mailto:${f.email}`, 'bg-lime'], [Phone, f.phone, f.phone && `tel:${f.phone.replace(/\s/g, '')}`, 'bg-sky'], [MapPin, f.address, null, 'bg-lemon']].filter(([, v]) => v).map(([I, v, href, bg]) => (
            <a key={v} href={href || undefined} className={`sticker flex items-center gap-4 p-5 ${bg}`}><I className="h-6 w-6" /><span className="font-bold">{v}</span></a>
          ))}
          <p className="hand text-3xl text-purple">party orders, collabs & bulk boxes welcome ✌️</p>
        </div>
        {sent ? <div className="sticker grid place-items-center bg-white p-10 text-center"><p className="display text-4xl text-grape">MESSAGE SENT 🍭</p><p className="mt-2 text-muted">We reply within a working day.</p></div> : (
          <form onSubmit={submit} className="sticker space-y-4 bg-white p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name"><input required minLength={2} className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
              <Field label="Email"><input required type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
            </div>
            <Field label="Message"><textarea required minLength={5} maxLength={2000} className="input min-h-40" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></Field>
            <button disabled={loading} className="btn btn-primary btn-lg">{loading ? <Spinner /> : 'Send it'}</button>
          </form>
        )}
      </div>
    </div>
  );
}
