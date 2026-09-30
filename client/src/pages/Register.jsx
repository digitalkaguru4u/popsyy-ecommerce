import { Link, useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import Seo from '../components/ui/Seo';
import AuthShell from './AuthShell';
import { RegisterForm } from '../components/AuthForms';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const n = params.get('next');
  const next = n && n.startsWith('/') && !n.startsWith('//') ? n : '/account';
  if (user) return <Navigate to={next} replace />;
  return (
    <AuthShell title="JOIN THE POP CLUB." hand="drops, deals, zero boring" color="#FF8A00" color2="#FF2E93">
      <Seo title="Create account" noindex path="/register" />
      <RegisterForm onDone={() => nav(next, { replace: true })} />
      <p className="mt-6 text-center text-sm font-semibold">Already popping? <Link to={`/login?next=${encodeURIComponent(next)}`} className="font-extrabold text-pink underline">Log in</Link></p>
    </AuthShell>
  );
}
