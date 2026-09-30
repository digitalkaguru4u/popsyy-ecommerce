import { Link } from 'react-router-dom';
import Seo from '../components/ui/Seo';
import { useSettings } from '../context/SettingsContext';
import { assetUrl } from '../services/api';
import { LimeSlice, OrangeSlice, Burst, Jamun, Berry } from '../components/ui/Decor';
import Marquee from '../components/ui/Marquee';

export default function About() {
  const { settings } = useSettings();
  const a = settings?.about || {};
  return (
    <div className="pb-10">
      <Seo title="Our story" description="Why POPSYY exists: real fruit ice pops with big flavour and zero boring." path="/about" />
      <section className="container-pop pt-6">
        <div className="relative overflow-hidden rounded-[2.5rem] border-[3px] border-ink bg-orange p-8 shadow-[10px_10px_0_#1c0a3d] md:p-14">
          <div aria-hidden className="grain absolute inset-0" />
          <LimeSlice className="absolute -right-8 -top-8 w-40 animate-spin-slow" />
          <h1 className="display relative max-w-4xl text-6xl text-white md:text-8xl" style={{ textShadow: '5px 5px 0 #1c0a3d' }}>{a.heading || 'WE MADE ICE POPS LOUD AGAIN.'}</h1>
        </div>
      </section>
      <section id="story" className="container-pop mt-14 grid gap-10 lg:grid-cols-2 lg:items-center">
        <div className="space-y-5 text-lg leading-relaxed text-ink/85">
          {(a.body || '').split(/\n\n+/).map((p, i) => <p key={i} className={i === 0 ? 'font-display text-2xl font-extrabold text-grape' : ''}>{p}</p>)}
          <Link to="/shop" className="btn btn-primary btn-lg">Taste the loud</Link>
        </div>
        <div className="relative">
          <img src={assetUrl('/images/brand/hero-pops.jpg')} alt="POPSYY pops lineup" className="aspect-[4/3] w-full rotate-2 rounded-[2rem] border-[3px] border-ink object-cover shadow-[8px_8px_0_#1c0a3d]" loading="lazy" />
          <Burst className="absolute -left-6 -top-6 h-28 w-28 -rotate-12" color="#D7FF3A" textClass="text-ink">real<br />fruit</Burst>
          <Jamun className="absolute -bottom-4 right-10 w-12" /><Berry className="absolute -bottom-6 right-2 w-10" /><OrangeSlice className="absolute right-0 top-1/2 w-20 md:-right-6" />
        </div>
      </section>
      <section className="mt-16 border-y-[3px] border-ink bg-purple py-4 text-white"><Marquee items={['REAL FRUIT', 'SMALL BATCH', 'SHIPPED FROZEN', '100% VEG', 'MADE IN INDIA']} itemClass="display text-4xl" separator="✦" /></section>
      <section className="container-pop mt-14 grid gap-5 md:grid-cols-3">
        {[['🍊', 'Real fruit first', 'Juice and pulp from real fruit — Nagpur oranges, jamun, lemons, cranberries.', 'bg-lemon'], ['🧊', 'Frozen door to door', 'Insulated boxes + dry ice, so your pops land frozen solid.', 'bg-sky'], ['🔊', 'Flavour turned up', 'We test every flavour until it tastes like a mood, not a syrup.', 'bg-lime']].map(([e, t, d, bg], i) => (
          <div key={t} className={`sticker p-6 ${bg} ${['-rotate-1', 'rotate-1', '-rotate-[0.5deg]'][i]}`}><p className="text-5xl">{e}</p><h2 className="display mt-3 text-3xl">{t}</h2><p className="mt-2 font-semibold text-ink/80">{d}</p></div>
        ))}
      </section>
    </div>
  );
}
