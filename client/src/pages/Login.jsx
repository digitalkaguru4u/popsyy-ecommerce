import { Link, useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import Seo from '../components/ui/Seo';
import AuthShell from './AuthShell';
import { LoginForm } from '../components/AuthForms';
import { useAuth } from '../context/AuthContext';

const safeNext = (n) => (n && n.startsWith('/') && !n.startsWith('//') ? n : null);

export default function Login() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const next = safeNext(params.get('next'));
  if (user) return <Navigate to={next || (user.role === 'admin' ? '/admin' : '/account')} replace />;
  return (
    <AuthShell title="WELCOME BACK." hand="your pops missed you">
      <Seo title="Log in" noindex path="/login" />
      <LoginForm onDone={(u) => nav(next || (u.role === 'admin' ? '/admin' : '/account'), { replace: true })} />
      <p className="mt-6 text-center text-sm font-semibold">New here? <Link to={`/register${next ? `?next=${encodeURIComponent(next)}` : ''}`} className="font-extrabold text-pink underline">Create an account</Link></p>
    </AuthShell>
  );
}
