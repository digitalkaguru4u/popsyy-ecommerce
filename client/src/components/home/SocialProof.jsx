import { motion, useReducedMotion } from 'framer-motion';
import { BadgeCheck } from 'lucide-react';
import Stars from '../ui/Stars';
import { colorsFor } from '../../utils/format';

const BG = ['bg-lemon', 'bg-white', 'bg-sky', 'bg-lime', 'bg-white', 'bg-[#FFC2E2]'];
const ROT = [-3, 2, -1.5, 3, -2, 1];

export default function SocialProof({ reviews = [] }) {
  const reduce = useReducedMotion();
  if (!reviews.length) return null;
  return (
    <section className="relative overflow-hidden bg-pink py-16 md:py-24" aria-labelledby="obsessed">
      <div aria-hidden className="grain absolute inset-0" />
      <div className="container-pop relative">
        <h2 id="obsessed" className="display text-center text-6xl text-white md:text-8xl" style={{ textShadow: '5px 5px 0 #1c0a3d' }}>THE INTERNET<br />IS <span className="text-lemon">OBSESSED.</span></h2>
        <div className="mt-12 columns-1 gap-6 sm:columns-2 lg:columns-3">
          {reviews.slice(0, 6).map((r, i) => {
            const c = colorsFor(r.product);
            return (
              <motion.figure key={r._id} className={`mb-6 break-inside-avoid rounded-[1.75rem] border-[3px] border-ink p-6 shadow-[6px_6px_0_#1c0a3d] ${BG[i % 6]}`}
                initial={reduce ? false : { opacity: 0, y: 40, rotate: ROT[i % 6] * 2 }} whileInView={{ opacity: 1, y: 0, rotate: ROT[i % 6] }} viewport={{ once: true }} transition={{ type: 'spring', stiffness: 120, damping: 14, delay: (i % 3) * 0.08 }}>
                <Stars value={r.rating} size={20} />
                <blockquote className="mt-3 font-display text-2xl font-extrabold leading-tight text-ink">“{r.title || r.body}”</blockquote>
                {r.title && <p className="mt-2 text-sm font-medium text-ink/75">{r.body}</p>}
                <figcaption className="mt-4 flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-full border-[3px] border-ink font-display text-lg font-extrabold text-ink" style={{ background: `linear-gradient(135deg, ${c.from}, ${c.to})` }} aria-hidden>{r.authorName?.[0]}</span>
                  <span className="text-sm">
                    <span className="flex items-center gap-1 font-extrabold">{r.authorName}{r.isVerifiedPurchase && <BadgeCheck className="h-4 w-4 text-purple" aria-label="Verified purchase" />}</span>
                    <span className="font-semibold text-ink/60">on {r.product?.name}</span>
                  </span>
                  {r.isSample && <span className="ml-auto rounded-full border border-ink/30 px-2 py-0.5 text-[10px] font-bold uppercase text-ink/50" title="Seeded demo review — remove before launch">sample</span>}
                </figcaption>
              </motion.figure>
            );
          })}
        </div>
      </div>
    </section>
  );
}
