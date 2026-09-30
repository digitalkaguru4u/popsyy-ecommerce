import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
export default function SectionHeading({ title, hand, cta, to, light = false, className = '' }) {
  return (
    <div className={`flex flex-wrap items-end justify-between gap-4 ${className}`}>
      <div className="flex flex-wrap items-end gap-x-5 gap-y-1">
        <h2 className={`display text-5xl sm:text-6xl md:text-7xl ${light ? 'text-white' : 'text-grape'}`}>{title}</h2>
        {hand && <span className={`hand -rotate-3 pb-2 text-3xl md:text-4xl ${light ? 'text-lemon' : 'text-purple'}`}>{hand}</span>}
      </div>
      {cta && <Link to={to} className={`group inline-flex items-center gap-2 font-display text-sm font-extrabold uppercase tracking-wide ${light ? 'text-white' : 'text-grape'}`}>{cta} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></Link>}
    </div>
  );
}
