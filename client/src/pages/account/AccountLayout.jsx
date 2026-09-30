import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { User, Package, MapPin, Heart, Ticket, Clock, Lock, LogOut } from 'lucide-react';
import Seo from '../../components/ui/Seo';
import { useAuth } from '../../context/AuthContext';

const LINKS = [['', 'Profile', User], ['orders', 'My Orders', Package], ['addresses', 'Addresses', MapPin], ['wishlist', 'Wishlist', Heart], ['coupons', 'Coupons', Ticket], ['recently-viewed', 'Recently viewed', Clock], ['password', 'Password', Lock]];

export default function AccountLayout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  return (
    <div className="container-pop py-6">
      <Seo title="My account" noindex />
      <h1 className="display text-5xl text-grape md:text-7xl">HEY, <span className="text-pink">{user?.name?.split(' ')[0]?.toUpperCase()}</span></h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-[250px_1fr]">
        <nav aria-label="Account" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
          {LINKS.map(([to, l, I]) => (
            <NavLink key={to} to={`/account${to ? `/${to}` : ''}`} end={!to} className={({ isActive }) => `flex shrink-0 items-center gap-3 rounded-2xl border-[3px] px-4 py-3 font-display text-sm font-extrabold uppercase transition ${isActive ? 'border-ink bg-lime shadow-[3px_3px_0_#1c0a3d]' : 'border-transparent hover:border-ink hover:bg-white'}`}><I className="h-4 w-4" />{l}</NavLink>
          ))}
          <button onClick={async () => { await logout(); nav('/'); }} className="flex shrink-0 items-center gap-3 rounded-2xl border-[3px] border-transparent px-4 py-3 font-display text-sm font-extrabold uppercase text-magenta hover:border-ink hover:bg-white"><LogOut className="h-4 w-4" /> Log out</button>
        </nav>
        <div className="min-w-0"><Outlet /></div>
      </div>
    </div>
  );
}
