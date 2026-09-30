import PopArt from '../components/product/PopArt';
import { LimeSlice, OrangeSlice } from '../components/ui/Decor';

export default function AuthShell({ title, hand, children, color = '#FF2E93', color2 = '#7B2FF7' }) {
  return (
    <div className="container-pop grid min-h-[70vh] items-center gap-10 py-10 lg:grid-cols-2">
      <div className="relative hidden h-full min-h-[480px] overflow-hidden rounded-[2.5rem] border-[3px] border-ink shadow-[10px_10px_0_#1c0a3d] lg:block" style={{ background: `linear-gradient(140deg, ${color}, ${color2})` }}>
        <div aria-hidden className="grain absolute inset-0" />
        <LimeSlice className="absolute left-10 top-10 w-28 animate-float-slow" />
        <OrangeSlice className="absolute bottom-12 right-10 w-32 animate-float" />
        <div className="absolute inset-0 grid place-items-center"><div className="w-40 animate-float [--r:-12deg]"><PopArt color="#D7FF3A" color2="#FFE14D" bite /></div></div>
        <p className="display absolute bottom-8 left-8 text-6xl text-white" style={{ textShadow: '4px 4px 0 #1c0a3d' }}>ONE POP.<br />ZERO<br />REGRETS.</p>
      </div>
      <div className="mx-auto w-full max-w-md">
        <h1 className="display text-5xl text-grape md:text-6xl">{title}</h1>
        {hand && <p className="hand mt-1 text-3xl text-purple">{hand}</p>}
        <div className="sticker mt-6 bg-white p-6">{children}</div>
      </div>
    </div>
  );
}
