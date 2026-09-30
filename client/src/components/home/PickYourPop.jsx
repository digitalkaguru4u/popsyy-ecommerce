import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import SectionHeading from './SectionHeading';
import { FRUIT_FOR, IceCube } from '../ui/Decor';
import { assetUrl } from '../../services/api';
import { isLight } from '../../utils/format';

const TILTS = [-2.5, 1.5, -1.5, 2.5];

export default function PickYourPop({ section, cards = [] }) {
  const reduce = useReducedMotion();
  return (
    <section className="container-pop py-16 md:py-24" aria-labelledby="pick-your-pop">
      <SectionHeading title={<span id="pick-your-pop">{section?.heading || 'PICK YOUR POP.'}</span>} hand={section?.subheading || '4 flavours. 1 attitude.'} cta="View all flavours" to="/flavours" />
      <div className="no-scrollbar -mx-4 mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-6 pt-2 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 xl:grid-cols-4">
        {cards.map((c, i) => {
          const p = c.product;
          if (!p) return null;
          const Fruit = FRUIT_FOR[p.flavour];
          const from = c.from || p.colors?.from;
          const to = c.to || p.colors?.to;
          const light = isLight(from);
          const img = c.image || p.images?.[0]?.url;
          return (
            <motion.div key={p._id} className="w-[78vw] max-w-[340px] shrink-0 snap-center md:w-auto md:max-w-none"
              initial={reduce ? false : { y: 60, opacity: 0, rotate: TILTS[i % 4] * 3 }} whileInView={{ y: 0, opacity: 1, rotate: TILTS[i % 4] }} viewport={{ once: true, margin: '-80px' }}
              transition={{ type: 'spring', stiffness: 110, damping: 14, delay: i * 0.08 }} whileHover={reduce ? undefined : { rotate: 0, scale: 1.03, y: -6 }}>
              <Link to={`/product/${p.slug}`} className="group relative block aspect-[4/5] overflow-hidden rounded-[2rem] border-[3px] border-ink shadow-[7px_7px_0_#1c0a3d] transition-shadow hover:shadow-[12px_12px_0_#1c0a3d]" style={{ background: `linear-gradient(150deg, ${from}, ${to})` }}>
                <div aria-hidden className="dots-bg absolute inset-0 opacity-30" />
                <div className={`relative z-10 p-6 ${light ? 'text-ink' : 'text-white'}`}>
                  <h3 className="display text-4xl md:text-[2.6rem]">{c.title || p.name}</h3>
                  <p className="mt-2 font-bold opacity-85">{c.tagline || p.tagline}</p>
                </div>
                {Fruit && <Fruit className="absolute -bottom-6 -left-6 w-36 transition duration-500 group-hover:-rotate-[30deg] group-hover:scale-110" />}
                <IceCube className="absolute bottom-[34%] left-[30%] w-10 animate-float [--r:15deg]" />
                <img src={assetUrl(img)} alt={`POPSYY ${p.name} ice pop`} loading="lazy" className="absolute -right-4 bottom-2 h-[72%] w-auto rotate-[14deg] drop-shadow-[0_20px_20px_rgba(28,10,61,.35)] transition duration-500 ease-out group-hover:-translate-y-4 group-hover:rotate-[4deg] group-hover:scale-105" />
                <span className="absolute bottom-5 right-5 z-10 grid h-12 w-12 place-items-center rounded-full border-[3px] border-ink bg-white text-ink transition group-hover:bg-lime group-hover:-rotate-45"><ArrowRight className="h-5 w-5" strokeWidth={3} /></span>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
