import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Seo from '../components/ui/Seo';
import AuthShell from './AuthShell';
import Field from '../components/ui/Field';
import Spinner from '../components/ui/Spinner';
import { PasswordInput } from '../components/AuthForms';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const nav = useNavigate();
  const { setUser } = useAuth();
  const toast = useToast();
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setErr('');
    if (pw !== pw2) return setErr("Passwords don't match");
    setLoading(true);
    try { const r = await api.post('/auth/reset-password', { token, password: pw }); setUser(r.user); toast.success('Password updated. You are logged in.'); nav('/account', { replace: true }); } catch (e2) { setErr(e2.message); } finally { setLoading(false); }
  };
  return (
    <AuthShell title="NEW PASSWORD." hand="make it a good one" color="#D7FF3A" color2="#26C6FF">
      <Seo title="Reset password" noindex path="/reset-password" />
      {!token ? <p className="font-bold">This link is missing its token. <Link className="underline" to="/forgot-password">Request a new one</Link>.</p> : (
        <form onSubmit={submit} className="space-y-4">
          <Field label="New password" hint="8+ characters with a letter and a number"><PasswordInput value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" minLength={8} /></Field>
          <Field label="Confirm password"><PasswordInput value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" minLength={8} /></Field>
          {err && <p className="text-sm font-bold text-magenta" role="alert">{err}</p>}
          <button disabled={loading} className="btn btn-primary btn-lg w-full">{loading ? <Spinner /> : 'Update password'}</button>
        </form>
      )}
    </AuthShell>
  );
}
