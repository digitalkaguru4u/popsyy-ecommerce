import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { PageHeader, Table, Toggle } from './ui';
import Modal from '../../components/ui/Modal';
import Field from '../../components/ui/Field';
import Spinner from '../../components/ui/Spinner';
import { useFetch } from '../../hooks/useFetch';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { fmtDate, inr } from '../../utils/format';

const EMPTY = { code: '', description: '', discountType: 'percentage', value: 10, minOrder: 0, maxDiscount: 0, startsAt: '', expiresAt: '', usageLimit: 0, perUserLimit: 1, isActive: true, isPublic: false };
const d = (v) => (v ? new Date(v).toISOString().slice(0, 10) : '');

export default function Coupons() {
  const toast = useToast();
  const { data, reload } = useFetch('/admin/coupons', { ttl: 0 });
  const [edit, setEdit] = useState(null);
  const [saving, setSaving] = useState(false);
  const toBody = (c) => ({ code: c.code, description: c.description, discountType: c.discountType, value: Number(c.value), minOrder: Number(c.minOrder), maxDiscount: Number(c.maxDiscount), startsAt: c.startsAt || undefined, expiresAt: c.expiresAt || null, usageLimit: Number(c.usageLimit), perUserLimit: Number(c.perUserLimit), isActive: c.isActive, isPublic: c.isPublic });
  const save = async (e) => {
    e.preventDefault(); setSaving(true);
    try { if (edit._id) await api.put(`/admin/coupons/${edit._id}`, toBody(edit)); else await api.post('/admin/coupons', toBody(edit)); toast.success('Coupon saved'); setEdit(null); reload(); } catch (err) { toast.error(err.message); } finally { setSaving(false); }
  };
  const toggle = async (c) => { try { await api.put(`/admin/coupons/${c._id}`, toBody({ ...c, startsAt: d(c.startsAt), expiresAt: d(c.expiresAt), isActive: !c.isActive })); reload(); } catch (e) { toast.error(e.message); } };
  const remove = async (c) => { if (!window.confirm(`Delete ${c.code}?`)) return; try { await api.del(`/admin/coupons/${c._id}`); reload(); } catch (e) { toast.error(e.message); } };
  return (
    <div>
      <PageHeader title="COUPONS" sub="Public coupons show in customers' “My coupons”."><button onClick={() => setEdit({ ...EMPTY })} className="btn btn-primary btn-sm"><Plus className="h-4 w-4" /> New coupon</button></PageHeader>
      <Table head={['Code', 'Discount', 'Min order', 'Validity', 'Used', 'Public', 'Active', '']} empty={data && !data.coupons.length ? 'No coupons.' : null}>
        {data?.coupons.map((c) => {
          const expired = c.expiresAt && new Date(c.expiresAt) < new Date();
          return (
            <tr key={c._id} className="hover:bg-cream/60">
              <td className="px-4 py-3"><p className="font-display font-extrabold tracking-wider">{c.code}</p><p className="text-xs text-muted">{c.description}</p></td>
              <td className="px-4 py-3 font-bold">{c.discountType === 'percentage' ? `${c.value}%${c.maxDiscount ? ` (max ${inr(c.maxDiscount)})` : ''}` : inr(c.value)}</td>
              <td className="px-4 py-3">{c.minOrder ? inr(c.minOrder) : '—'}</td>
              <td className="px-4 py-3 text-xs">{fmtDate(c.startsAt)} → {c.expiresAt ? fmtDate(c.expiresAt) : '∞'}{expired && <span className="ml-1 font-bold text-magenta">expired</span>}</td>
              <td className="px-4 py-3">{c.usedCount}{c.usageLimit ? ` / ${c.usageLimit}` : ''}<p className="text-[10px] text-muted">{c.perUserLimit ? `${c.perUserLimit}/user` : 'unlimited/user'}</p></td>
              <td className="px-4 py-3">{c.isPublic ? 'Yes' : 'No'}</td>
              <td className="px-4 py-3"><Toggle checked={c.isActive} onChange={() => toggle(c)} /></td>
              <td className="px-4 py-3"><div className="flex justify-end gap-1"><button onClick={() => setEdit({ ...c, startsAt: d(c.startsAt), expiresAt: d(c.expiresAt) })} className="grid h-8 w-8 place-items-center rounded-full hover:bg-lemon" aria-label="Edit"><Pencil className="h-4 w-4" /></button><button onClick={() => remove(c)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-pink hover:text-white" aria-label="Delete"><Trash2 className="h-4 w-4" /></button></div></td>
            </tr>
          );
        })}
      </Table>
      <Modal open={Boolean(edit)} onClose={() => setEdit(null)} title={edit?._id ? `Edit ${edit.code}` : 'New coupon'} wide>
        {edit && (
          <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
            <Field label="Code"><input className="input uppercase" required pattern="[A-Za-z0-9_-]{3,30}" value={edit.code} onChange={(e) => setEdit({ ...edit, code: e.target.value.toUpperCase() })} /></Field>
            <Field label="Description"><input className="input" value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /></Field>
            <Field label="Type"><select className="input" value={edit.discountType} onChange={(e) => setEdit({ ...edit, discountType: e.target.value })}><option value="percentage">Percentage</option><option value="fixed">Fixed ₹</option></select></Field>
            <Field label={edit.discountType === 'percentage' ? 'Percent off' : 'Amount off (₹)'}><input className="input" type="number" min={1} max={edit.discountType === 'percentage' ? 100 : undefined} required value={edit.value} onChange={(e) => setEdit({ ...edit, value: e.target.value })} /></Field>
            <Field label="Minimum order (₹)"><input className="input" type="number" min={0} value={edit.minOrder} onChange={(e) => setEdit({ ...edit, minOrder: e.target.value })} /></Field>
            <Field label="Max discount (₹, 0 = no cap)"><input className="input" type="number" min={0} disabled={edit.discountType === 'fixed'} value={edit.maxDiscount} onChange={(e) => setEdit({ ...edit, maxDiscount: e.target.value })} /></Field>
            <Field label="Starts"><input className="input" type="date" value={edit.startsAt} onChange={(e) => setEdit({ ...edit, startsAt: e.target.value })} /></Field>
            <Field label="Expires (blank = never)"><input className="input" type="date" value={edit.expiresAt} onChange={(e) => setEdit({ ...edit, expiresAt: e.target.value })} /></Field>
            <Field label="Total usage limit (0 = unlimited)"><input className="input" type="number" min={0} value={edit.usageLimit} onChange={(e) => setEdit({ ...edit, usageLimit: e.target.value })} /></Field>
            <Field label="Per-customer limit (0 = unlimited)"><input className="input" type="number" min={0} value={edit.perUserLimit} onChange={(e) => setEdit({ ...edit, perUserLimit: e.target.value })} /></Field>
            <Toggle checked={edit.isActive} onChange={(v) => setEdit({ ...edit, isActive: v })} label="Active" />
            <Toggle checked={edit.isPublic} onChange={(v) => setEdit({ ...edit, isPublic: v })} label="Show to customers" />
            <button disabled={saving} className="btn btn-primary sm:col-span-2">{saving ? <Spinner /> : 'Save coupon'}</button>
          </form>
        )}
      </Modal>
    </div>
  );
}
