import Seo from '../components/ui/Seo';
import BoxBuilder from '../components/box/BoxBuilder';
import { Burst } from '../components/ui/Decor';

export default function BuildBox() {
  return (
    <div className="container-pop pb-10 pt-6">
      <Seo title="Build Your Own Box" description="Mix any POPSYY flavours into a 6, 12 or 24 pop box. Save up to 27%." path="/build-your-box" />
      <div className="relative mb-10 overflow-hidden rounded-[2rem] border-[3px] border-ink bg-ink px-6 py-10 text-white shadow-[6px_6px_0_#FF2E93] md:px-12 md:py-14">
        <h1 className="display text-6xl md:text-8xl">BUILD YOUR<br /><span className="text-lime">OWN BOX</span></h1>
        <p className="hand mt-2 text-3xl text-lemon">your freezer, your rules.</p>
        <Burst className="absolute right-6 top-6 hidden h-32 w-32 rotate-12 md:grid" color="#FF2E93" textClass="text-white">mix<br />&amp; match</Burst>
      </div>
      <BoxBuilder />
    </div>
  );
}
