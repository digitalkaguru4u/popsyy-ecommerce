import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Suspense } from 'react';
import Header from './Header';
import Footer from './Footer';
import CartDrawer from './CartDrawer';
import CustomCursor from '../ui/CustomCursor';
import { PageSpinner } from '../ui/Spinner';

export default function StoreLayout() {
  const loc = useLocation();
  const reduce = useReducedMotion();
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[300] focus:rounded-full focus:bg-lime focus:px-4 focus:py-2 focus:font-bold">Skip to content</a>
      <Header />
      <AnimatePresence mode="wait" initial={false}>
        <motion.main id="main" key={loc.pathname} className="flex-1"
          initial={reduce ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? undefined : { opacity: 0, y: -10 }} transition={{ duration: 0.25, ease: 'easeOut' }}>
          <Suspense fallback={<PageSpinner />}><Outlet /></Suspense>
        </motion.main>
      </AnimatePresence>
      <Footer />
      <CartDrawer />
      <CustomCursor />
    </div>
  );
}
