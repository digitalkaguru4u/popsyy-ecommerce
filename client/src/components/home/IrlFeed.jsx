import { motion, useReducedMotion } from 'framer-motion';
import { Heart, MessageCircle } from 'lucide-react';
import { InstagramIcon, TiktokIcon } from '../ui/SocialIcons';
import { assetUrl } from '../../services/api';

const ROT = [-3, 2, -1, 3, -2, 1.5];
const OFFSET = ['', 'md:mt-12', '', 'md:mt-8', 'md:-mt-4', 'md:mt-14'];

export default function IrlFeed({ feed = [], instagram }) {
  const reduce = useReducedMotion();
  if (!feed.length) return null;
  return (
    <section className="container-pop py-16 md:py-24" aria-labelledby="irl">
      <div className="flex flex-col items-center text-center">
        <h2 id="irl" className="display text-6xl text-grape md:text-8xl">POPSYY <span className="rounded-3xl border-[3px] border-ink bg-lime px-3">IRL</span></h2>
        <p className="hand mt-3 -rotate-2 text-3xl text-purple">tag @popsyy.in to get featured</p>
      </div>
      <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-6">
        {feed.slice(0, 6).map((f, i) => {
          const Icon = f.platform === 'tiktok' ? TiktokIcon : InstagramIcon;
          const Card = f.link ? 'a' : 'div';
          return (
            <motion.div key={i} className={OFFSET[i % 6]} initial={reduce ? false : { opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0, rotate: ROT[i % 6] }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} whileHover={reduce ? undefined : { rotate: 0, scale: 1.04 }}>
              <Card {...(f.link ? { href: f.link, target: '_blank', rel: 'noopener noreferrer' } : {})} className="group block overflow-hidden rounded-[1.5rem] border-[3px] border-ink bg-white shadow-[5px_5px_0_#1c0a3d]">
                <div className="flex items-center gap-2 px-3 py-2"><span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-pink to-orange text-white"><Icon className="h-3.5 w-3.5" /></span><span className="truncate text-xs font-extrabold">{f.handle}</span></div>
                <div className={`relative overflow-hidden ${f.platform === 'tiktok' ? 'aspect-[9/14]' : 'aspect-square'}`}>
                  <img src={assetUrl(f.image)} alt={f.caption || 'POPSYY on social'} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
                </div>
                <div className="flex items-center gap-3 px-3 py-2 text-ink"><Heart className="h-4 w-4" /><MessageCircle className="h-4 w-4" /><span className="truncate text-xs font-semibold text-ink/70">{f.caption}</span></div>
              </Card>
            </motion.div>
          );
        })}
      </div>
      <div className="mt-12 text-center">
        <a href={instagram || '#'} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-lg"><InstagramIcon className="h-5 w-5" /> FOLLOW THE POP</a>
      </div>
    </section>
  );
}
