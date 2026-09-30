import { useState } from 'react';
import { Link } from 'react-router-dom';
import Seo from '../components/ui/Seo';
import AuthShell from './AuthShell';
import Field from '../components/ui/Field';
import Spinner from '../components/ui/Spinner';
import { api } from '../services/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setErr(''); setLoading(true);
    try { const r = await api.post('/auth/forgot-password', { email }); setMsg(r.message); } catch (e2) { setErr(e2.message); } finally { setLoading(false); }
  };
  return (
    <AuthShell title="FORGOT IT?" hand="happens to the best of us" color="#26C6FF" color2="#7B2FF7">
      <Seo title="Forgot password" noindex path="/forgot-password" />
      {msg ? <p className="rounded-2xl bg-lime p-4 font-bold">{msg} Check your inbox (and spam).</p> : (
        <form onSubmit={submit} className="space-y-4">
          <Field label="Email"><input type="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></Field>
          {err && <p className="text-sm font-bold text-magenta" role="alert">{err}</p>}
          <button disabled={loading} className="btn btn-primary btn-lg w-full">{loading ? <Spinner /> : 'Send reset link'}</button>
        </form>
      )}
      <Link to="/login" className="mt-6 block text-center text-sm font-bold underline">Back to log in</Link>
    </AuthShell>
  );
}
