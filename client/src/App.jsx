import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import StoreLayout from './components/layout/StoreLayout';
import { useSettings } from './context/SettingsContext';
import { useAuth } from './context/AuthContext';
import { PageSpinner } from './components/ui/Spinner';
import Home from './pages/Home';

const Shop = lazy(() => import('./pages/Shop'));
const Product = lazy(() => import('./pages/Product'));
const Flavours = lazy(() => import('./pages/Flavours'));
const BuildBox = lazy(() => import('./pages/BuildBox'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderSuccess = lazy(() => import('./pages/OrderSuccess'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const TrackOrder = lazy(() => import('./pages/TrackOrder'));
const About = lazy(() => import('./pages/About'));
const Faqs = lazy(() => import('./pages/Faqs'));
const Contact = lazy(() => import('./pages/Contact'));
const Policy = lazy(() => import('./pages/Policy'));
const NotFound = lazy(() => import('./pages/NotFound'));

const AccountLayout = lazy(() => import('./pages/account/AccountLayout'));
const AccountOverview = lazy(() => import('./pages/account/Overview'));
const AccountOrders = lazy(() => import('./pages/account/Orders'));
const AccountOrderDetail = lazy(() => import('./pages/account/OrderDetail'));
const AccountAddresses = lazy(() => import('./pages/account/Addresses'));
const AccountWishlist = lazy(() => import('./pages/account/Wishlist'));
const AccountCoupons = lazy(() => import('./pages/account/Coupons'));
const AccountRecent = lazy(() => import('./pages/account/RecentlyViewed'));
const AccountPassword = lazy(() => import('./pages/account/ChangePassword'));

const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const AdminApp = lazy(() => import('./pages/admin/AdminApp'));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [pathname]);
  return null;
}

function BootLoader() {
  const { ready } = useSettings();
  const auth = useAuth();
  useEffect(() => {
    if (!ready || !auth.ready) return;
    const el = document.getElementById('pop-loader');
    if (!el) return;
    let seen = false;
    try { seen = sessionStorage.getItem('popsyy_seen') === '1'; sessionStorage.setItem('popsyy_seen', '1'); } catch { /* private mode */ }
    const wait = seen ? 0 : Math.max(0, 1500 - performance.now());
    const t = setTimeout(() => { el.classList.add('done'); setTimeout(() => el.remove(), 500); }, wait);
    return () => clearTimeout(t);
  }, [ready, auth.ready]);
  return null;
}

export function RequireAuth({ children, admin = false }) {
  const { user, ready } = useAuth();
  const loc = useLocation();
  if (!ready) return <PageSpinner />;
  if (!user) return <Navigate to={`${admin ? '/admin/login' : '/login'}?next=${encodeURIComponent(loc.pathname + loc.search)}`} replace />;
  if (admin && user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <BootLoader />
      <Suspense fallback={<PageSpinner />}>
        <Routes>
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/*" element={<RequireAuth admin><AdminApp /></RequireAuth>} />
          <Route element={<StoreLayout />}>
            <Route index element={<Home />} />
            <Route path="shop" element={<Shop />} />
            <Route path="flavours" element={<Flavours />} />
            <Route path="product/:slug" element={<Product />} />
            <Route path="build-your-box" element={<BuildBox />} />
            <Route path="cart" element={<Cart />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="order/success/:id" element={<RequireAuth><OrderSuccess /></RequireAuth>} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="reset-password" element={<ResetPassword />} />
            <Route path="track-order" element={<TrackOrder />} />
            <Route path="about" element={<About />} />
            <Route path="faqs" element={<Faqs />} />
            <Route path="contact" element={<Contact />} />
            <Route path="shipping" element={<Policy page="shipping" />} />
            <Route path="returns" element={<Policy page="returns" />} />
            <Route path="privacy" element={<Policy page="privacy" />} />
            <Route path="terms" element={<Policy page="terms" />} />
            <Route path="account" element={<RequireAuth><AccountLayout /></RequireAuth>}>
              <Route index element={<AccountOverview />} />
              <Route path="orders" element={<AccountOrders />} />
              <Route path="orders/:id" element={<AccountOrderDetail />} />
              <Route path="addresses" element={<AccountAddresses />} />
              <Route path="wishlist" element={<AccountWishlist />} />
              <Route path="coupons" element={<AccountCoupons />} />
              <Route path="recently-viewed" element={<AccountRecent />} />
              <Route path="password" element={<AccountPassword />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}
