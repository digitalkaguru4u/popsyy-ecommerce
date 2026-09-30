import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Field from './ui/Field';
import Spinner from './ui/Spinner';

export function PasswordInput({ value, onChange, autoComplete = 'current-password', id, placeholder = '••••••••', minLength, ...rest }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input id={id} {...rest} type={show ? 'text' : 'password'} className="input pr-12" value={value} onChange={onChange} autoComplete={autoComplete} placeholder={placeholder} required minLength={minLength} />
      <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full hover:bg-lemon">{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
    </div>
  );
}

export function LoginForm({ onDone }) {
  const { login } = useAuth();
  const toast = useToast();
  const [f, setF] = useState({ email: '', password: '' });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setLoading(true);
    try { const u = await login(f.email, f.password); toast.success(`Welcome back, ${u.name.split(' ')[0]} 🍭`); onDone?.(u); } catch (e2) { setErr(e2.message); } finally { setLoading(false); }
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Email"><input type="email" className="input" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} autoComplete="email" required /></Field>
      <Field label="Password"><PasswordInput value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></Field>
      {err && <p className="rounded-xl bg-pink/10 p-3 text-sm font-bold text-magenta" role="alert">{err}</p>}
      <button disabled={loading} className="btn btn-primary btn-lg w-full">{loading ? <Spinner /> : 'Log in'}</button>
      <Link to="/forgot-password" className="block text-center text-sm font-bold underline">Forgot password?</Link>
    </form>
  );
}

export function RegisterForm({ onDone }) {
  const { register } = useAuth();
  const toast = useToast();
  const [f, setF] = useState({ name: '', email: '', phone: '', password: '', marketingOptIn: true });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setLoading(true);
    try { const u = await register(f); toast.success(`Welcome to the Pop Club, ${u.name.split(' ')[0]}! 🎉`); onDone?.(u); } catch (e2) { setErr(e2.message); } finally { setLoading(false); }
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Name"><input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoComplete="name" required minLength={2} /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Email"><input type="email" className="input" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} autoComplete="email" required /></Field>
        <Field label="Mobile (optional)"><input type="tel" inputMode="numeric" className="input" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} autoComplete="tel" placeholder="98xxxxxxxx" /></Field>
      </div>
      <Field label="Password" hint="8+ characters with a letter and a number"><PasswordInput value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} autoComplete="new-password" minLength={8} /></Field>
      <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={f.marketingOptIn} onChange={(e) => setF({ ...f, marketingOptIn: e.target.checked })} className="h-4 w-4 accent-pink" /> Send me drops & deals (zero boring emails)</label>
      {err && <p className="rounded-xl bg-pink/10 p-3 text-sm font-bold text-magenta" role="alert">{err}</p>}
      <button disabled={loading} className="btn btn-primary btn-lg w-full">{loading ? <Spinner /> : 'Create account'}</button>
    </form>
  );
}
