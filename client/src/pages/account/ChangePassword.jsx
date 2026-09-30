import { useState } from 'react';
import Field from '../../components/ui/Field';
import Spinner from '../../components/ui/Spinner';
import { PasswordInput } from '../../components/AuthForms';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function ChangePassword() {
  const toast = useToast();
  const [f, setF] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setErr('');
    if (f.newPassword !== f.confirm) return setErr("New passwords don't match");
    setSaving(true);
    try { await api.put('/auth/change-password', { currentPassword: f.currentPassword, newPassword: f.newPassword }); toast.success('Password updated'); setF({ currentPassword: '', newPassword: '', confirm: '' }); } catch (e2) { setErr(e2.message); } finally { setSaving(false); }
  };
  return (
    <form onSubmit={submit} className="sticker max-w-lg space-y-4 bg-white p-6">
      <h2 className="display text-3xl text-grape">Change password</h2>
      <Field label="Current password"><PasswordInput value={f.currentPassword} onChange={(e) => setF({ ...f, currentPassword: e.target.value })} /></Field>
      <Field label="New password" hint="8+ characters with a letter and a number"><PasswordInput value={f.newPassword} onChange={(e) => setF({ ...f, newPassword: e.target.value })} autoComplete="new-password" minLength={8} /></Field>
      <Field label="Confirm new password"><PasswordInput value={f.confirm} onChange={(e) => setF({ ...f, confirm: e.target.value })} autoComplete="new-password" minLength={8} /></Field>
      {err && <p className="text-sm font-bold text-magenta" role="alert">{err}</p>}
      <button disabled={saving} className="btn btn-primary">{saving ? <Spinner /> : 'Update password'}</button>
    </form>
  );
}
