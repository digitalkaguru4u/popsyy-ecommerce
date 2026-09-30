import BoxBuilder from '../box/BoxBuilder';
import { Burst } from '../ui/Decor';

export default function BoxSection() {
  return (
    <section id="build-your-box" className="relative overflow-hidden bg-cream py-16 md:py-24" aria-labelledby="byob">
      <div aria-hidden className="dots-bg absolute inset-0" />
      <div className="container-pop relative">
        <div className="relative mb-10 max-w-3xl">
          <h2 id="byob" className="display text-6xl text-grape md:text-8xl">BUILD YOUR<br /><span className="text-stroke">OWN</span> <span className="text-pink">BOX</span></h2>
          <p className="hand mt-2 -rotate-2 text-3xl text-purple">mix it. match it. freeze it.</p>
          <Burst className="absolute -top-6 right-0 hidden h-32 w-32 rotate-12 md:grid" color="#D7FF3A" textClass="text-ink text-lg">Up to<br />27% off</Burst>
        </div>
        <BoxBuilder />
      </div>
    </section>
  );
}
