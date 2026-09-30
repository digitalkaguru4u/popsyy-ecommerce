import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';
import { InstagramIcon, TiktokIcon, YoutubeIcon } from '../ui/SocialIcons';
import Marquee from '../ui/Marquee';

const COLS = [
  { title: 'Shop', links: [['All Pops', '/shop'], ['Bestsellers', '/shop?bestseller=true'], ['Build Your Box', '/build-your-box'], ['Flavours', '/flavours']] },
  { title: 'Help', links: [['Contact', '/contact'], ['FAQs', '/faqs'], ['Shipping', '/shipping'], ['Returns', '/returns'], ['Track Order', '/track-order']] },
  { title: 'Company', links: [['About POPSYY', '/about'], ['Our Story', '/about#story'], ['Contact', '/contact'], ['Privacy', '/privacy'], ['Terms', '/terms']] },
];

export default function Footer() {
  const { settings } = useSettings();
  const s = settings?.socials || {};
  const f = settings?.footer || {};
  const [year] = useState(new Date().getFullYear());
  return (
    <footer className="relative mt-20 overflow-hidden border-t-[3px] border-ink bg-grape text-white">
      <div className="border-b-[3px] border-ink bg-lime py-3 text-ink">
        <Marquee items={['CHILL', 'POP', 'REPEAT', 'ZERO BORING', 'BIG FLAVOUR']} itemClass="display text-3xl md:text-4xl" separator="🍭" />
      </div>
      <div className="container-pop grid gap-10 py-14 md:grid-cols-[1.4fr_repeat(4,1fr)]">
        <div>
          <p className="display text-6xl text-lime md:text-7xl">POPSYY</p>
          <p className="hand mt-2 text-3xl text-lemon">{f.tagline || 'Big flavour. Zero boring.'}</p>
          <div className="mt-6 space-y-1 text-sm text-white/70">
            {f.email && <p><a href={`mailto:${f.email}`} className="hover:text-lime">{f.email}</a></p>}
            {f.phone && <p>{f.phone}</p>}
            {f.address && <p>{f.address}</p>}
          </div>
        </div>
        {COLS.map((c) => (
          <div key={c.title}>
            <h3 className="font-display text-sm font-extrabold uppercase tracking-widest text-lime">{c.title}</h3>
            <ul className="mt-4 space-y-2">{c.links.map(([l, to]) => <li key={l + to}><Link to={to} className="font-semibold text-white/85 transition hover:translate-x-1 hover:text-lemon">{l}</Link></li>)}</ul>
          </div>
        ))}
        <div>
          <h3 className="font-display text-sm font-extrabold uppercase tracking-widest text-lime">Social</h3>
          <ul className="mt-4 space-y-3">
            {[['Instagram', s.instagram, InstagramIcon, 'bg-pink'], ['TikTok', s.tiktok, TiktokIcon, 'bg-cyan'], ['YouTube', s.youtube, YoutubeIcon, 'bg-orange']].filter(([, url]) => url).map(([n, url, I, bg]) => (
              <li key={n}><a href={url} target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-3 font-semibold"><span className={`grid h-10 w-10 place-items-center rounded-full border-[3px] border-ink ${bg} text-ink transition group-hover:-rotate-12 group-hover:scale-110`}><I className="h-5 w-5" /></span>{n}</a></li>
            ))}
          </ul>
        </div>
      </div>
      <div className="container-pop relative flex flex-col items-start justify-between gap-2 border-t border-white/15 py-6 text-xs text-white/60 sm:flex-row">
        <p>© {year} POPSYY. All pops reserved. Prices incl. GST.</p>
        <p>Made loud in India 🇮🇳</p>
      </div>
      <p aria-hidden className="display pointer-events-none select-none whitespace-nowrap text-center text-[26vw] leading-[0.75] text-white/[0.06]">POPSYY</p>
    </footer>
  );
}
