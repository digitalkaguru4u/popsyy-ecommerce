import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Seo from '../components/ui/Seo';
import ProductImage from '../components/product/ProductImage';
import Skeleton from '../components/ui/Skeleton';
import { FRUIT_FOR, IceCube, Sparkle } from '../components/ui/Decor';
import { useFetch } from '../hooks/useFetch';
import { colorsFor, inr, isLight } from '../utils/format';

export default function Flavours() {
  const { data, loading } = useFetch('/products/flavours');
  const reduce = useReducedMotion();
  return (
    <div className="pb-10">
      <Seo title="Flavours" description="Meet all four POPSYY flavours: Lemon Lime, Orange, Cranberry and Kala Khatta." path="/flavours" />
      <div className="container-pop pt-6 text-center">
        <h1 className="display text-[15vw] text-grape sm:text-7xl md:text-9xl">THE <span className="text-pink">FLAVOURS</span></h1>
        <p className="hand mt-2 text-3xl text-purple">flavour so loud it needs a warning</p>
      </div>
      <div className="mt-10 space-y-6 md:space-y-10">
        {loading && <div className="container-pop"><Skeleton className="h-96" /></div>}
        {data?.products?.map((p, i) => {
          const c = colorsFor(p);
          const light = isLight(c.from);
          const Fruit = FRUIT_FOR[p.flavour];
          const flip = i % 2 === 1;
          return (
            <motion.section key={p._id} initial={reduce ? false : { opacity: 0, y: 60 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-100px' }} className="container-pop">
              <div className={`relative grid items-center gap-6 overflow-hidden rounded-[2.5rem] border-[3px] border-ink p-8 shadow-[10px_10px_0_#1c0a3d] md:grid-cols-2 md:p-14 ${light ? 'text-ink' : 'text-white'}`} style={{ background: `linear-gradient(${flip ? 220 : 140}deg, ${c.from}, ${c.to})` }}>
                <div aria-hidden className="dots-bg absolute inset-0 opacity-30" />
                <div className={`relative ${flip ? 'md:order-2' : ''}`}>
                  <span className="font-display text-sm font-extrabold uppercase tracking-widest opacity-70">No. 0{i + 1}</span>
                  <h2 className="display mt-2 text-6xl md:text-8xl">{p.name}</h2>
                  <p className="hand mt-2 text-3xl">{p.tagline}</p>
                  <p className="mt-4 max-w-md text-lg font-semibold opacity-90">{p.shortDescription}</p>
                  <div className="mt-6 flex flex-wrap gap-2">{p.moods?.map((m) => <Link key={m} to={`/shop?mood=${m}`} className="chip bg-white text-ink">#{m}</Link>)}</div>
                  <div className="mt-8 flex flex-wrap items-center gap-4">
                    <Link to={`/product/${p.slug}`} className="btn btn-light btn-lg">Get {p.name} <ArrowRight className="h-5 w-5" /></Link>
                    <span className="font-display text-xl font-extrabold">from {inr(p.price)}</span>
                  </div>
                </div>
                <div className={`relative grid h-[380px] place-items-center md:h-[480px] ${flip ? 'md:order-1' : ''}`}>
                  {Fruit && <Fruit className="absolute bottom-6 left-4 w-32 animate-float-slow md:w-44" />}
                  <IceCube className="absolute right-8 top-6 w-16 animate-float [--r:20deg]" />
                  <Sparkle className="absolute left-10 top-10 w-10 animate-spin-slow" color="#fff" />
                  <ProductImage product={p} className="relative h-full w-auto rotate-[10deg] animate-float drop-shadow-[0_30px_30px_rgba(28,10,61,.35)] [--r:10deg]" />
                </div>
              </div>
            </motion.section>
          );
        })}
      </div>
    </div>
  );
}
