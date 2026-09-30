import { useState } from 'react';
import Field from '../../components/ui/Field';
import Spinner from '../../components/ui/Spinner';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useFetch } from '../../hooks/useFetch';
import { api } from '../../services/api';
import { fmtDate, inr } from '../../utils/format';

export default function Overview() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const { data } = useFetch('/account/summary', { ttl: 0 });
  const [f, setF] = useState({ name: user.name, phone: user.phone || '', marketingOptIn: Boolean(user.marketingOptIn) });
  const [saving, setSaving] = useState(false);
  const save = async (e) => {
    e.preventDefault(); setSaving(true);
    try { const r = await api.put('/auth/profile', f); setUser(r.user); toast.success('Profile saved'); } catch (err) { toast.error(err.message); } finally { setSaving(false); }
  };
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {[['Orders', data?.orders ?? '–', 'bg-lemon'], ['Spent', data ? inr(data.spent) : '–', 'bg-lime'], ['Member since', fmtDate(user.createdAt, { month: 'short', year: 'numeric' }), 'bg-sky']].map(([l, v, bg]) => (
          <div key={l} className={`sticker p-5 ${bg}`}><p className="text-xs font-extrabold uppercase">{l}</p><p className="display mt-1 text-4xl">{v}</p></div>
        ))}
      </div>
      <form onSubmit={save} className="sticker space-y-4 bg-white p-6">
        <h2 className="display text-3xl text-grape">Profile</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name"><input className="input" required minLength={2} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Mobile"><input className="input" type="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
          <Field label="Email" className="sm:col-span-2"><input className="input bg-cream" value={user.email} readOnly /></Field>
        </div>
        <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={f.marketingOptIn} onChange={(e) => setF({ ...f, marketingOptIn: e.target.checked })} className="h-4 w-4 accent-pink" /> Email me new drops & deals</label>
        <button disabled={saving} className="btn btn-primary">{saving ? <Spinner /> : 'Save changes'}</button>
      </form>
    </div>
  );
}
