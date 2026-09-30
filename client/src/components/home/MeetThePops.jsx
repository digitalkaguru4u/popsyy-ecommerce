import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ProductCard from '../product/ProductCard';
import SectionHeading from './SectionHeading';
import { CardSkeleton } from '../ui/Skeleton';
import { Burst } from '../ui/Decor';

const TILT = [-1.5, 2, -2, 1.2];

export default function MeetThePops({ products, loading }) {
  return (
    <section className="relative overflow-hidden border-y-[3px] border-ink bg-lemon py-16 md:py-24" aria-labelledby="meet-the-pops">
      <div aria-hidden className="dots-bg absolute inset-0 opacity-50" />
      <div className="container-pop relative">
        <SectionHeading title={<span id="meet-the-pops">MEET THE POPS.</span>} hand="say hi 👋" cta="Shop all" to="/shop" />
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-[auto_auto]">
          {loading && [0, 1, 2, 3].map((i) => <CardSkeleton key={i} />)}
          {products?.slice(0, 4).map((p, i) => (
            <div key={p._id} className={i === 0 ? 'lg:col-span-2 lg:row-span-2' : i === 3 ? 'lg:col-span-1 lg:mt-10' : ''}>
              <ProductCard product={p} tilt={TILT[i % 4]} size={i === 0 ? 'lg' : 'md'} index={i} />
            </div>
          ))}
          {!loading && (
            <motion.div initial={{ rotate: 6, scale: 0.9, opacity: 0 }} whileInView={{ rotate: 3, scale: 1, opacity: 1 }} viewport={{ once: true }} className="lg:-mt-6">
              <Link to="/build-your-box" className="group relative flex h-full min-h-[260px] flex-col justify-between overflow-hidden rounded-[1.75rem] border-[3px] border-ink bg-ink p-6 text-white shadow-[6px_6px_0_#FF2E93] transition hover:rotate-0">
                <p className="display text-4xl leading-[0.9]">CAN'T<br />PICK<br /><span className="text-lime">ONE?</span></p>
                <p className="font-bold text-white/80">Mix all four in a Build-Your-Box.</p>
                <Burst className="absolute -right-4 -top-4 h-28 w-28 transition group-hover:rotate-45" color="#D7FF3A" textClass="text-ink text-sm">save<br />27%</Burst>
              </Link>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
