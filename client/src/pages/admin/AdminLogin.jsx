import { useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock } from 'lucide-react';
import Seo from '../../components/ui/Seo';
import Logo from '../../components/layout/Logo';
import Field from '../../components/ui/Field';
import Spinner from '../../components/ui/Spinner';
import { PasswordInput } from '../../components/AuthForms';
import { useAuth } from '../../context/AuthContext';

export default function AdminLogin() {
  const { user, adminLogin } = useAuth();
  const [params] = useSearchParams();
  const nav = useNavigate();
  const [f, setF] = useState({ email: '', password: '' });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const next = params.get('next')?.startsWith('/admin') ? params.get('next') : '/admin';
  if (user?.role === 'admin') return <Navigate to={next} replace />;
  const submit = async (e) => {
    e.preventDefault(); setErr(''); setLoading(true);
    try { await adminLogin(f.email, f.password); nav(next, { replace: true }); } catch (e2) { setErr(e2.message); } finally { setLoading(false); }
  };
  return (
    <div className="grid min-h-screen place-items-center bg-grape p-4">
      <Seo title="Admin login" noindex />
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-[2rem] border-[3px] border-ink bg-white p-7 shadow-[8px_8px_0_#D7FF3A]">
        <Logo />
        <h1 className="display flex items-center gap-2 text-3xl text-grape"><Lock className="h-6 w-6" /> Admin</h1>
        <Field label="Email"><input type="email" className="input" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} autoComplete="username" /></Field>
        <Field label="Password"><PasswordInput value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></Field>
        {err && <p className="text-sm font-bold text-magenta" role="alert">{err}</p>}
        <button disabled={loading} className="btn btn-dark w-full">{loading ? <Spinner /> : 'Enter dashboard'}</button>
      </form>
    </div>
  );
}
