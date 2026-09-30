import { useState } from 'react';
import { Plus, Pencil, Trash2, Star } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import Field from '../../components/ui/Field';
import Spinner from '../../components/ui/Spinner';
import Skeleton from '../../components/ui/Skeleton';
import { useFetch } from '../../hooks/useFetch';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const EMPTY = { label: 'home', name: '', phone: '', line1: '', line2: '', landmark: '', city: '', state: '', pincode: '', isDefault: false };

export default function Addresses() {
  const toast = useToast();
  const { data, loading, reload } = useFetch('/account/addresses', { ttl: 0 });
  const [edit, setEdit] = useState(null);
  const [saving, setSaving] = useState(false);
  const save = async (e) => {
    e.preventDefault(); setSaving(true);
    const { _id, user, createdAt, updatedAt, __v, country, ...body } = edit; // eslint-disable-line no-unused-vars
    try {
      if (_id) await api.put(`/account/addresses/${_id}`, body); else await api.post('/account/addresses', body);
      toast.success('Address saved'); setEdit(null); reload();
    } catch (err) { toast.error(err.message); } finally { setSaving(false); }
  };
  const remove = async (id) => { if (!window.confirm('Delete this address?')) return; try { await api.del(`/account/addresses/${id}`); reload(); } catch (e) { toast.error(e.message); } };
  const makeDefault = async (id) => { try { await api.put(`/account/addresses/${id}`, { isDefault: true }); reload(); } catch (e) { toast.error(e.message); } };
  return (
    <div>
      <div className="mb-4 flex items-center justify-between"><h2 className="display text-3xl text-grape">Saved addresses</h2><button onClick={() => setEdit({ ...EMPTY })} className="btn btn-primary btn-sm"><Plus className="h-4 w-4" /> Add</button></div>
      {loading && !data && <Skeleton className="h-32" />}
      {data?.addresses?.length === 0 && <p className="rounded-2xl border-[3px] border-dashed border-ink/30 p-8 text-center font-bold text-muted">No saved addresses yet.</p>}
      <div className="grid gap-4 md:grid-cols-2">
        {data?.addresses?.map((a) => (
          <div key={a._id} className={`sticker p-5 ${a.isDefault ? 'bg-lime' : 'bg-white'}`}>
            <div className="flex items-center justify-between"><span className="chip">{a.label}{a.isDefault && ' · default'}</span>
              <div className="flex gap-1">
                {!a.isDefault && <button onClick={() => makeDefault(a._id)} aria-label="Make default" className="grid h-9 w-9 place-items-center rounded-full hover:bg-lemon"><Star className="h-4 w-4" /></button>}
                <button onClick={() => setEdit(a)} aria-label="Edit" className="grid h-9 w-9 place-items-center rounded-full hover:bg-lemon"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => remove(a._id)} aria-label="Delete" className="grid h-9 w-9 place-items-center rounded-full hover:bg-pink hover:text-white"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
            <p className="mt-3 font-extrabold">{a.name} · {a.phone}</p>
            <p className="text-sm">{a.line1}{a.line2 ? `, ${a.line2}` : ''}{a.landmark ? ` (${a.landmark})` : ''}<br />{a.city}, {a.state} {a.pincode}</p>
          </div>
        ))}
      </div>
      <Modal open={Boolean(edit)} onClose={() => setEdit(null)} title={edit?._id ? 'Edit address' : 'New address'} wide>
        {edit && (
          <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
            <Field label="Label"><select className="input" value={edit.label} onChange={(e) => setEdit({ ...edit, label: e.target.value })}><option value="home">Home</option><option value="work">Work</option><option value="other">Other</option></select></Field>
            <Field label="Full name"><input className="input" required value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
            <Field label="Mobile"><input className="input" required type="tel" value={edit.phone} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} /></Field>
            <Field label="Pincode"><input className="input" required inputMode="numeric" maxLength={6} value={edit.pincode} onChange={(e) => setEdit({ ...edit, pincode: e.target.value.replace(/\D/g, '') })} /></Field>
            <Field label="Flat, house, building" className="sm:col-span-2"><input className="input" required value={edit.line1} onChange={(e) => setEdit({ ...edit, line1: e.target.value })} /></Field>
            <Field label="Area, street" className="sm:col-span-2"><input className="input" value={edit.line2} onChange={(e) => setEdit({ ...edit, line2: e.target.value })} /></Field>
            <Field label="Landmark"><input className="input" value={edit.landmark} onChange={(e) => setEdit({ ...edit, landmark: e.target.value })} /></Field>
            <Field label="City"><input className="input" required value={edit.city} onChange={(e) => setEdit({ ...edit, city: e.target.value })} /></Field>
            <Field label="State"><input className="input" required value={edit.state} onChange={(e) => setEdit({ ...edit, state: e.target.value })} /></Field>
            <label className="flex items-center gap-2 self-end pb-3 text-sm font-semibold"><input type="checkbox" checked={Boolean(edit.isDefault)} onChange={(e) => setEdit({ ...edit, isDefault: e.target.checked })} className="h-4 w-4 accent-pink" /> Default address</label>
            <button disabled={saving} className="btn btn-primary sm:col-span-2">{saving ? <Spinner /> : 'Save address'}</button>
          </form>
        )}
      </Modal>
    </div>
  );
}
