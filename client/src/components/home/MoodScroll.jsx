import { useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { LimeSlice, OrangeSlice, Berry, Jamun, IceCube, Drop, Sparkle } from '../ui/Decor';

// Section 5 — the popsicle travels, spins and changes flavour as you scroll
export default function MoodScroll() {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const bg = useTransform(p, [0, 0.33, 0.66, 1], ['#7B2FF7', '#FF2E93', '#FF8A00', '#7ED321']);
  const rotate = useTransform(p, [0, 1], [-25, reduce ? -25 : 340]);
  const x = useTransform(p, [0, 0.5, 1], reduce ? ['0%', '0%', '0%'] : ['-28%', '22%', '0%']);
  const scale = useTransform(p, [0, 0.5, 1], [0.8, 1.15, 0.95]);
  const t1 = useTransform(p, [0, 0.12, 0.4, 0.5], [0, 1, 1, 0]);
  const t1y = useTransform(p, [0, 0.12], [80, 0]);
  const t2 = useTransform(p, [0.48, 0.6, 1], [0, 1, 1]);
  const t2y = useTransform(p, [0.48, 0.6], [80, 0]);
  const popIdx = useTransform(p, [0, 0.25, 0.5, 0.75, 1], [0, 1, 2, 3, 3]);
  const o0 = useTransform(popIdx, [0, 0.5, 1], [1, 1, 0]);
  const o1 = useTransform(popIdx, [0.5, 1, 1.5, 2], [0, 1, 1, 0]);
  const o2 = useTransform(popIdx, [1.5, 2, 2.5, 3], [0, 1, 1, 0]);
  const o3 = useTransform(popIdx, [2.5, 3], [0, 1]);
  const fy1 = useTransform(p, [0, 1], [200, -500]);
  const fy2 = useTransform(p, [0, 1], [400, -800]);
  const fy3 = useTransform(p, [0, 1], [100, -300]);
  const pops = [['kala-khatta', o0], ['cranberry', o1], ['orange', o2], ['lemon-lime', o3]];

  return (
    <section ref={ref} className="relative h-[260vh] border-b-[3px] border-ink bg-purple" aria-label="It's not just a pop. It's a whole mood.">
      <motion.div style={{ backgroundColor: bg }} className="sticky top-0 flex h-screen items-center overflow-hidden">
        <div aria-hidden className="grain absolute inset-0" />
        <div aria-hidden className="dots-bg absolute inset-0 opacity-30" />

        <motion.div style={{ y: fy1 }} className="pointer-events-none absolute inset-0" aria-hidden>
          <LimeSlice className="absolute left-[8%] top-[20%] w-24 md:w-32" />
          <IceCube className="absolute right-[12%] top-[35%] w-16" />
          <Drop className="absolute left-[30%] top-[70%] w-8" />
        </motion.div>
        <motion.div style={{ y: fy2 }} className="pointer-events-none absolute inset-0" aria-hidden>
          <OrangeSlice className="absolute right-[6%] top-[60%] w-24 md:w-36" />
          <Berry className="absolute left-[18%] top-[85%] w-12" />
          <Sparkle className="absolute right-[30%] top-[90%] w-10" color="#FFE14D" />
          <IceCube className="absolute left-[4%] top-[110%] w-20" />
        </motion.div>
        <motion.div style={{ y: fy3 }} className="pointer-events-none absolute inset-0" aria-hidden>
          <Jamun className="absolute right-[40%] top-[15%] w-10" />
          <Drop className="absolute right-[22%] top-[50%] w-6" color="#fff" />
          <Sparkle className="absolute left-[45%] top-[80%] w-8" color="#D7FF3A" />
        </motion.div>

        <div className="container-pop relative grid h-full items-center">
          <motion.div style={{ opacity: t1, y: t1y }} className="absolute inset-x-4 top-[14%] text-center md:inset-x-10 md:text-left">
            <p className="display text-[16vw] text-white md:text-[9vw]" style={{ textShadow: '6px 6px 0 #1c0a3d' }}>IT'S NOT<br />JUST A POP.</p>
          </motion.div>
          <motion.div style={{ opacity: t2, y: t2y }} className="absolute inset-x-4 bottom-[10%] text-center md:inset-x-10 md:text-right">
            <p className="display text-[16vw] text-white md:text-[9vw]" style={{ textShadow: '6px 6px 0 #1c0a3d' }}>IT'S A WHOLE<br /><span className="text-lemon">MOOD.</span></p>
          </motion.div>
          <motion.div style={{ rotate, x, scale }} className="relative mx-auto h-[52vh] w-[26vh] md:h-[62vh] md:w-[31vh]">
            {pops.map(([slug, o]) => (
              <motion.img key={slug} src={`/images/products/${slug}.svg`} alt="" aria-hidden style={{ opacity: o }} className="absolute inset-0 h-full w-full object-contain drop-shadow-[0_30px_30px_rgba(28,10,61,.45)]" loading="lazy" />
            ))}
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
