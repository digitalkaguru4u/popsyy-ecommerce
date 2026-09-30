import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import SectionHeading from './SectionHeading';
import { isLight } from '../../utils/format';

const SPANS = ['md:col-span-3 md:row-span-2', 'md:col-span-3', 'md:col-span-3', 'md:col-span-3', 'md:col-span-3'];
const ROT = [-1.5, 1, -1, 2, -2];

export default function ShopByMood({ moods = [] }) {
  const reduce = useReducedMotion();
  return (
    <section className="container-pop py-16 md:py-24" aria-labelledby="shop-by-mood">
      <SectionHeading title={<span id="shop-by-mood">SHOP BY MOOD</span>} hand="how are we feeling?" />
      <div className="mt-10 grid auto-rows-[190px] grid-cols-1 gap-5 sm:grid-cols-2 md:auto-rows-[210px] md:grid-cols-6">
        {moods.map((m, i) => {
          const light = isLight(m.from);
          return (
            <motion.div key={m.key} className={`${SPANS[i % 5]} ${i === 0 ? 'sm:col-span-2' : ''}`}
              initial={reduce ? false : { opacity: 0, scale: 0.9, rotate: ROT[i % 5] * 3 }} whileInView={{ opacity: 1, scale: 1, rotate: ROT[i % 5] }} viewport={{ once: true, margin: '-60px' }}
              whileHover={reduce ? undefined : { rotate: 0, scale: 1.02 }} transition={{ type: 'spring', stiffness: 140, damping: 15 }}>
              <Link to={`/shop?mood=${m.key}`} className={`group relative flex h-full flex-col justify-between overflow-hidden rounded-[2rem] border-[3px] border-ink p-6 shadow-[6px_6px_0_#1c0a3d] ${light ? 'text-ink' : 'text-white'}`} style={{ background: `linear-gradient(135deg, ${m.from}, ${m.to})` }}>
                <span aria-hidden className="absolute -bottom-8 -right-4 select-none text-[9rem] leading-none transition duration-500 group-hover:-rotate-12 group-hover:scale-110 md:text-[11rem]">{m.emoji}</span>
                <div className="relative">
                  <h3 className={`display ${i === 0 ? 'text-6xl md:text-8xl' : 'text-4xl md:text-5xl'}`}>{m.title}</h3>
                  <p className="mt-2 max-w-[70%] font-bold opacity-90">{m.subtitle}</p>
                </div>
                <span className="relative inline-flex w-fit items-center gap-1 rounded-full border-[3px] border-ink bg-white px-4 py-2 font-display text-xs font-extrabold uppercase text-ink transition group-hover:bg-lime">Shop the mood <ArrowUpRight className="h-4 w-4" /></span>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
