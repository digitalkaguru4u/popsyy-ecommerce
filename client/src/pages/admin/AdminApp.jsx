import { lazy, Suspense, useEffect, useState } from 'react';
import { NavLink, Route, Routes, useLocation, useNavigate, Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { LayoutDashboard, TrendingUp, Package, ShoppingBag, Users, Ticket, Boxes, MessageSquare, Palette, Bell, LogOut, Menu, X, ExternalLink } from 'lucide-react';
import Seo from '../../components/ui/Seo';
import Logo from '../../components/layout/Logo';
import { PageSpinner } from '../../components/ui/Spinner';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { fmtDateTime } from '../../utils/format';

const Dashboard = lazy(() => import('./Dashboard'));
const Analytics = lazy(() => import('./Analytics'));
const Products = lazy(() => import('./Products'));
const ProductEdit = lazy(() => import('./ProductEdit'));
const Orders = lazy(() => import('./Orders'));
const OrderDetail = lazy(() => import('./OrderDetail'));
const Customers = lazy(() => import('./Customers'));
const CustomerDetail = lazy(() => import('./CustomerDetail'));
const Coupons = lazy(() => import('./Coupons'));
const Inventory = lazy(() => import('./Inventory'));
const Reviews = lazy(() => import('./Reviews'));
const Cms = lazy(() => import('./Cms'));

const NAV = [
  ['', 'Dashboard', LayoutDashboard], ['analytics', 'Analytics', TrendingUp], ['orders', 'Orders', ShoppingBag], ['products', 'Products', Package],
  ['inventory', 'Inventory', Boxes], ['customers', 'Customers', Users], ['coupons', 'Coupons', Ticket], ['reviews', 'Reviews', MessageSquare], ['cms', 'Content / CMS', Palette],
];

export default function AdminApp() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState({ notifications: [], unread: 0 });
  const [bell, setBell] = useState(false);
  const [system, setSystem] = useState(null);

  const loadNotes = () => api.get('/admin/notifications').then(setNotes).catch(() => {});
  useEffect(() => { loadNotes(); api.get('/admin/system').then((r) => setSystem(r.integrations)).catch(() => {}); const t = setInterval(loadNotes, 60000); return () => clearInterval(t); }, []);
  useEffect(() => setOpen(false), [loc.pathname]);

  const Side = (
    <aside className="flex h-full flex-col gap-1 p-4">
      <Link to="/admin" className="mb-4 px-2"><Logo light /><span className="ml-1 rounded-full bg-lime px-2 py-0.5 text-[10px] font-extrabold uppercase text-ink">admin</span></Link>
      {NAV.map(([to, l, I]) => (
        <NavLink key={to} to={`/admin${to ? `/${to}` : ''}`} end={!to} className={({ isActive }) => `flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-extrabold transition ${isActive ? 'bg-lime text-ink' : 'text-white/80 hover:bg-white/10 hover:text-white'}`}><I className="h-4 w-4" />{l}</NavLink>
      ))}
      <div className="mt-auto space-y-2 pt-6">
        {system && (
          <div className="rounded-2xl bg-white/10 p-3 text-[11px] font-bold text-white/80">
            <p className="mb-1 uppercase tracking-wider text-white/50">Integrations</p>
            <p>Payments: <span className={system.payments === 'razorpay' ? 'text-lime' : 'text-lemon'}>{system.payments === 'mock' ? 'TEST SIMULATOR' : system.payments}</span></p>
            <p>Webhook: {system.webhook ? <span className="text-lime">set</span> : <span className="text-lemon">not set</span>}</p>
            <p>Images: {system.images}</p>
            <p>Email: <span className={system.email === 'smtp' ? 'text-lime' : 'text-lemon'}>{system.email}</span></p>
          </div>
        )}
        <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-bold text-white/70 hover:text-white"><ExternalLink className="h-4 w-4" /> View store</a>
        <button onClick={async () => { await logout(); nav('/admin/login'); }} className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-sm font-bold text-white/70 hover:text-white"><LogOut className="h-4 w-4" /> Log out</button>
      </div>
    </aside>
  );

  return (
    <div className="admin-scope min-h-screen bg-cream">
      <Seo title="Admin" noindex />
      <div className="fixed inset-y-0 left-0 hidden w-60 overflow-y-auto border-r-[3px] border-ink bg-grape lg:block">{Side}</div>
      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-50 bg-ink/50 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)}>
            <motion.div className="h-full w-64 overflow-y-auto bg-grape" initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }} onClick={(e) => e.stopPropagation()}>{Side}</motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="lg:pl-60">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b-[3px] border-ink bg-white px-4 py-3 md:px-8">
          <button onClick={() => setOpen(true)} className="grid h-10 w-10 place-items-center rounded-full border-2 border-ink lg:hidden" aria-label="Open menu"><Menu className="h-5 w-5" /></button>
          <p className="hidden text-sm font-bold text-muted sm:block">Hi {user?.name?.split(' ')[0]} — let's sell some pops.</p>
          <div className="relative">
            <button onClick={() => { setBell(!bell); if (!bell && notes.unread) api.post('/admin/notifications/read').then(loadNotes); }} className="relative grid h-10 w-10 place-items-center rounded-full border-2 border-ink" aria-label={`Notifications (${notes.unread} unread)`}>
              <Bell className="h-5 w-5" />{notes.unread > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-pink px-1 text-[10px] font-extrabold text-white">{notes.unread}</span>}
            </button>
            {bell && (
              <div className="absolute right-0 top-12 z-40 max-h-[70vh] w-80 overflow-y-auto rounded-2xl border-[3px] border-ink bg-white shadow-[5px_5px_0_#1c0a3d]">
                <div className="flex items-center justify-between border-b-2 border-ink/10 p-3"><p className="font-display font-extrabold uppercase">Notifications</p><button onClick={() => setBell(false)} aria-label="Close"><X className="h-4 w-4" /></button></div>
                {notes.notifications.length === 0 && <p className="p-4 text-sm text-muted">All quiet.</p>}
                {notes.notifications.map((n) => (
                  <Link key={n._id} to={n.link || '/admin'} onClick={() => setBell(false)} className={`block border-b border-ink/5 p-3 text-sm hover:bg-cream ${n.read ? '' : 'bg-lemon/30'}`}>
                    <p className="font-bold">{n.title}</p>{n.message && <p className="text-xs text-muted">{n.message}</p>}<p className="mt-1 text-[10px] font-semibold text-ink/40">{fmtDateTime(n.createdAt)}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </header>
        <main className="p-4 md:p-8">
          <Suspense fallback={<PageSpinner />}>
            <Routes>
              <Route index element={<Dashboard />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="products" element={<Products />} />
              <Route path="products/new" element={<ProductEdit />} />
              <Route path="products/:id" element={<ProductEdit />} />
              <Route path="orders" element={<Orders />} />
              <Route path="orders/:id" element={<OrderDetail />} />
              <Route path="customers" element={<Customers />} />
              <Route path="customers/:id" element={<CustomerDetail />} />
              <Route path="coupons" element={<Coupons />} />
              <Route path="inventory" element={<Inventory />} />
              <Route path="reviews" element={<Reviews />} />
              <Route path="cms" element={<Cms />} />
              <Route path="*" element={<p className="font-bold">Not found. <Link to="/admin" className="underline">Back to dashboard</Link></p>} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  );
}
