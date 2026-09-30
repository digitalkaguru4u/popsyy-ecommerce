import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { ArrowRight, Snowflake } from 'lucide-react';
import Magnetic from '../ui/Magnetic';
import { LimeSlice, OrangeSlice, Berry, Jamun, IceCube, Drop, Sparkle, Burst } from '../ui/Decor';
import { assetUrl } from '../../services/api';

const POPS = [
  { src: '/images/products/lemon-lime.svg', r: -18, x: '2%', y: '18%', d: 0 },
  { src: '/images/products/orange.svg', r: -6, x: '22%', y: '4%', d: 0.8 },
  { src: '/images/products/cranberry.svg', r: 8, x: '44%', y: '10%', d: 0.4 },
  { src: '/images/products/kala-khatta.svg', r: 20, x: '64%', y: '20%', d: 1.2 },
];

export default function Hero({ hero }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const yPops = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -140]);
  const yPhoto = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 80]);
  const yFruit = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -260]);
  const rot = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 25]);

  const h = hero || {};
  const lines = h.headline?.length ? h.headline : ['POP', 'YOUR', 'MOOD.'];
  const lineStyles = ['text-white', 'text-lime', 'text-lemon'];

  return (
    <section ref={ref} className="relative -mt-[88px] overflow-hidden bg-purple pb-16 pt-[120px] md:-mt-[96px] md:pb-24 md:pt-[140px]" aria-label="POPSYY hero">
      {/* colour blobs */}
      <div aria-hidden className="absolute -left-40 top-10 h-[520px] w-[520px] rounded-full bg-pink opacity-70 blur-[90px]" />
      <div aria-hidden className="absolute -right-32 bottom-0 h-[460px] w-[460px] rounded-full bg-orange opacity-60 blur-[90px]" />
      <div aria-hidden className="absolute left-1/2 top-1/3 h-[300px] w-[300px] rounded-full bg-cyan opacity-40 blur-[80px]" />
      <div aria-hidden className="grain absolute inset-0" />

      <div className="container-pop relative grid items-center gap-10 lg:grid-cols-[1.05fr_1fr]">
        <div className="relative z-10">
          <motion.span initial={{ y: 20, opacity: 0, rotate: -6 }} animate={{ y: 0, opacity: 1, rotate: -3 }} transition={{ delay: 0.1 }} className="chip bg-lime">
            <Snowflake className="h-3.5 w-3.5" /> {h.eyebrow || 'NEW DROP · 4 FLAVOURS'}
          </motion.span>
          <h1 className="display mt-5 text-[21vw] sm:text-[17vw] lg:text-[10.5vw] xl:text-[150px]">
            {lines.map((l, i) => (
              <motion.span key={i} className={`block ${lineStyles[i % 3]} ${i === 1 ? 'pl-[0.4em]' : ''}`} style={{ textShadow: '5px 5px 0 #1c0a3d' }}
                initial={reduce ? false : { y: 90, opacity: 0, rotate: 4 }} animate={{ y: 0, opacity: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 140, damping: 14, delay: 0.15 + i * 0.1 }}>
                {l}
              </motion.span>
            ))}
          </h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="mt-6 max-w-md text-lg font-semibold text-white/90 md:text-xl">
            {h.subheading || 'Big flavour. Zero boring.'}
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }} className="mt-8 flex flex-wrap gap-3">
            <Magnetic><Link to={h.ctaPrimary?.link || '/shop'} className="btn btn-lime btn-lg">{h.ctaPrimary?.text || 'SHOP POPS'} <ArrowRight className="h-5 w-5" /></Link></Magnetic>
            <Magnetic><Link to={h.ctaSecondary?.link || '/flavours'} className="btn btn-light btn-lg">{h.ctaSecondary?.text || 'EXPLORE FLAVOURS'}</Link></Magnetic>
          </motion.div>
          <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm font-extrabold uppercase tracking-wide text-white/85">
            <span>🍋 Real fruit</span><span>🧊 Ships frozen</span><span>🌱 100% veg</span>
          </div>
        </div>

        {/* visual stack */}
        <div className="relative mx-auto aspect-square w-full max-w-[620px]">
          <motion.div style={{ y: yPhoto, rotate: rot }} className="absolute inset-[8%] overflow-hidden rounded-[42%_58%_55%_45%/48%_42%_58%_52%] border-[4px] border-ink bg-sky shadow-[10px_10px_0_#1c0a3d]">
            <img src={assetUrl(h.image || '/images/brand/hero-pops.jpg')} alt="POPSYY ice pops in five colours surrounded by ice, fruit and water splashes" className="h-full w-full scale-110 object-cover" fetchPriority="high" decoding="async" />
          </motion.div>

          <motion.div style={{ y: yPops }} className="pointer-events-none absolute inset-x-0 -bottom-6 h-[70%]">
            {POPS.map((p, i) => (
              <motion.img key={p.src} src={p.src} alt="" aria-hidden className="absolute w-[30%] drop-shadow-[0_24px_24px_rgba(28,10,61,.4)]"
                style={{ left: p.x, top: p.y }}
                initial={reduce ? false : { y: 200, rotate: p.r - 30, opacity: 0 }}
                animate={reduce ? { rotate: p.r } : { y: [0, -16, 0], rotate: [p.r, p.r + 4, p.r], opacity: 1 }}
                transition={reduce ? undefined : { y: { duration: 4 + i * 0.4, repeat: Infinity, ease: 'easeInOut', delay: 0.6 + p.d }, rotate: { duration: 4 + i * 0.4, repeat: Infinity, ease: 'easeInOut', delay: 0.6 + p.d }, opacity: { duration: 0.4, delay: 0.3 + i * 0.1 } }} />
            ))}
          </motion.div>

          <motion.div style={{ y: yFruit }} className="pointer-events-none absolute inset-0" aria-hidden>
            <LimeSlice className="absolute -left-2 top-[6%] w-20 animate-float [--r:-20deg] md:w-24" />
            <OrangeSlice className="absolute right-[2%] top-[2%] w-16 animate-float-slow [--r:15deg] md:w-20" />
            <Berry className="absolute bottom-[22%] -right-2 w-12 animate-float" />
            <Jamun className="absolute bottom-[6%] left-[4%] w-10 animate-float-slow" />
            <IceCube className="absolute left-[40%] -top-4 w-14 animate-float [--r:12deg]" />
            <IceCube className="absolute bottom-[40%] -left-4 w-10 animate-float-slow [--r:-18deg]" />
            <Drop className="absolute right-[18%] top-[30%] w-6 animate-float" />
            <Sparkle className="absolute left-[18%] top-[38%] w-8 animate-spin-slow" color="#FFE14D" />
          </motion.div>

          <Burst className="absolute -right-2 bottom-[18%] h-28 w-28 rotate-12 md:h-32 md:w-32" color="#FFE14D" textClass="text-sm md:text-base text-ink">Real<br />fruit!</Burst>
        </div>
      </div>
    </section>
  );
}
