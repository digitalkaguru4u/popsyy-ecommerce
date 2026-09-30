import Marquee from '../ui/Marquee';
export default function MarqueeStrip({ items }) {
  const list = items?.length ? items : ['POPSYY', 'BIG FLAVOUR', 'ZERO BORING', 'POP YOUR MOOD', 'CHILL', 'REPEAT'];
  return (
    <section aria-label="POPSYY slogans" className="relative z-10 -mt-6 overflow-hidden py-6">
      <div className="-rotate-2 border-y-[3px] border-ink bg-pink py-3 text-white shadow-[0_6px_0_#1c0a3d]">
        <Marquee items={list} itemClass="display text-4xl md:text-6xl" separator="●" />
      </div>
      <div className="relative -mt-3 rotate-1 border-y-[3px] border-ink bg-lime py-2 text-ink">
        <Marquee items={[...list].reverse()} reverse itemClass="display text-2xl md:text-3xl" separator="🍭" speed={34} />
      </div>
    </section>
  );
}
