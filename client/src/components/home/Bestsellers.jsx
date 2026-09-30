import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from '../product/ProductCard';
import SectionHeading from './SectionHeading';
import { CardSkeleton } from '../ui/Skeleton';

export default function Bestsellers({ products, loading }) {
  const track = useRef(null);
  const scroll = (dir) => track.current?.scrollBy({ left: dir * Math.min(360, track.current.clientWidth * 0.8), behavior: 'smooth' });
  return (
    <section className="relative overflow-hidden border-y-[3px] border-ink bg-ink py-16 text-white md:py-24" aria-labelledby="bestsellers">
      <div className="container-pop">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading light title={<span id="bestsellers">THE POPS<br />EVERYONE'S <span className="text-lime">SNAGGING</span></span>} hand="🔥 hot right now" />
          <div className="flex gap-2">
            <button onClick={() => scroll(-1)} aria-label="Previous" className="grid h-12 w-12 place-items-center rounded-full border-[3px] border-white bg-transparent transition hover:bg-lime hover:text-ink"><ChevronLeft /></button>
            <button onClick={() => scroll(1)} aria-label="Next" className="grid h-12 w-12 place-items-center rounded-full border-[3px] border-white bg-lime text-ink transition hover:bg-lemon"><ChevronRight /></button>
          </div>
        </div>
      </div>
      <div ref={track} className="no-scrollbar mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-6 pt-2 sm:px-6 lg:px-[max(2.5rem,calc((100vw-1400px)/2+2.5rem))]">
        {loading && [0, 1, 2, 3].map((i) => <div key={i} className="w-[76vw] max-w-[320px] shrink-0"><CardSkeleton /></div>)}
        {products?.map((p, i) => (
          <div key={p._id} className="w-[76vw] max-w-[320px] shrink-0 snap-start text-ink"><ProductCard product={p} index={i} tilt={i % 2 ? 1 : -1} /></div>
        ))}
      </div>
    </section>
  );
}
