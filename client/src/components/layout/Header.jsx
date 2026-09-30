import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Heart, Menu, Search, ShoppingBag, User, X } from 'lucide-react';
import Logo from './Logo';
import SearchOverlay from './SearchOverlay';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import Marquee from '../ui/Marquee';

const NAV = [
  { to: '/shop', label: 'Shop' },
  { to: '/flavours', label: 'Flavours' },
  { to: '/build-your-box', label: 'Build a Box' },
  { to: '/about', label: 'Our Story' },
];

export default function Header() {
  const { count, setOpen, cartIconRef } = useCart();
  const { user } = useAuth();
  const { settings } = useSettings();
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const loc = useLocation();

  useEffect(() => { setMenu(false); setSearch(false); }, [loc.pathname]);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 24);
    h();
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);
  useEffect(() => { document.body.style.overflow = menu ? 'hidden' : ''; }, [menu]);

  return (
    <>
      {settings?.announcement && (
        <div className="relative z-40 border-b-[3px] border-ink bg-ink py-2 text-xs font-extrabold uppercase tracking-widest text-lime">
          <Marquee items={[settings.announcement, 'Real fruit. Zero boring.', 'Build your own box', settings.announcement]} separator="🍭" speed={40} />
        </div>
      )}
      <header className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'py-2' : 'py-3 md:py-4'}`}>
        <div className="container-pop">
          <div className={`flex items-center justify-between gap-3 rounded-full border-[3px] border-ink bg-white/95 px-2.5 py-1.5 backdrop-blur transition-shadow sm:px-3 sm:py-2 md:px-5 ${scrolled ? 'shadow-[5px_5px_0_#1c0a3d]' : 'shadow-[3px_3px_0_#1c0a3d]'}`}>
            <Link to="/" aria-label="POPSYY home" className="shrink-0 transition hover:-rotate-3"><Logo /></Link>
            <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
              {NAV.map((n) => (
                <NavLink key={n.to} to={n.to} className={({ isActive }) => `rounded-full px-4 py-2 font-display text-sm font-extrabold uppercase tracking-wide transition hover:bg-lemon ${isActive ? 'bg-lime' : ''}`}>{n.label}</NavLink>
              ))}
            </nav>
            <div className="flex items-center gap-0.5 sm:gap-1.5">
              <Link to="/shop" className="hidden rounded-full px-2 py-2 font-display text-xs min-[360px]:inline font-extrabold uppercase lg:hidden">Shop</Link>
              <IconBtn label="Search" onClick={() => setSearch(true)}><Search className="h-5 w-5" /></IconBtn>
              <IconBtn label="Wishlist" to={user ? '/account/wishlist' : '/login?next=/account/wishlist'} className="hidden sm:grid"><Heart className="h-5 w-5" /></IconBtn>
              <IconBtn label={user ? 'My account' : 'Log in'} to={user ? (user.role === 'admin' ? '/admin' : '/account') : '/login'} className="hidden sm:grid"><User className="h-5 w-5" /></IconBtn>
              <button ref={cartIconRef} onClick={() => setOpen(true)} aria-label={`Cart, ${count} items`} className="relative grid h-10 w-10 sm:h-11 sm:w-11 shrink-0 place-items-center rounded-full border-[3px] border-ink bg-pink text-white transition hover:scale-105 active:scale-95">
                <ShoppingBag className="h-5 w-5" />
                <AnimatePresence>
                  {count > 0 && (
                    <motion.span key={count} initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="absolute -right-1.5 -top-1.5 grid h-6 min-w-6 place-items-center rounded-full border-2 border-ink bg-lime px-1 text-[11px] font-extrabold text-ink">{count}</motion.span>
                  )}
                </AnimatePresence>
              </button>
              <IconBtn label="Menu" onClick={() => setMenu(true)} className="lg:hidden"><Menu className="h-5 w-5" /></IconBtn>
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {menu && (
          <motion.div className="fixed inset-0 z-[90] flex flex-col bg-purple p-5 text-white lg:hidden" initial={{ clipPath: 'circle(0% at 95% 5%)' }} animate={{ clipPath: 'circle(150% at 95% 5%)' }} exit={{ clipPath: 'circle(0% at 95% 5%)' }} transition={{ duration: 0.45, ease: [0.7, 0, 0.3, 1] }}>
            <div className="flex items-center justify-between"><Logo light /><button onClick={() => setMenu(false)} aria-label="Close menu" className="grid h-11 w-11 place-items-center rounded-full border-[3px] border-ink bg-lime text-ink"><X /></button></div>
            <nav className="mt-10 flex flex-col gap-2" aria-label="Mobile">
              {[{ to: '/', label: 'Home' }, ...NAV, { to: '/track-order', label: 'Track Order' }, { to: user ? '/account' : '/login', label: user ? 'My Account' : 'Log in' }].map((n, i) => (
                <motion.div key={n.to} initial={{ x: -40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.15 + i * 0.05 }}>
                  <Link to={n.to} className="display block py-1 text-5xl text-white transition hover:text-lime">{n.label}</Link>
                </motion.div>
              ))}
            </nav>
            <p className="hand mt-auto text-3xl text-lemon">chill. pop. repeat.</p>
          </motion.div>
        )}
      </AnimatePresence>
      <SearchOverlay open={search} onClose={() => setSearch(false)} />
    </>
  );
}

function IconBtn({ children, label, to, onClick, className = '' }) {
  const cls = `grid h-10 w-10 sm:h-11 sm:w-11 place-items-center rounded-full border-[3px] border-transparent transition hover:border-ink hover:bg-lemon active:scale-95 ${className}`;
  return to ? <Link to={to} aria-label={label} className={cls}>{children}</Link> : <button onClick={onClick} aria-label={label} className={cls}>{children}</button>;
}
