import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Seo from '../components/ui/Seo';
import PopArt from '../components/product/PopArt';
import { Drop } from '../components/ui/Decor';

export default function NotFound() {
  return (
    <div className="container-pop grid min-h-[70vh] place-items-center py-10 text-center">
      <Seo title="Page not found" noindex />
      <div>
        <div className="relative mx-auto w-40">
          <motion.div animate={{ scaleY: [1, 0.92, 1], y: [0, 6, 0] }} transition={{ duration: 2.4, repeat: Infinity }} style={{ transformOrigin: 'bottom' }}><PopArt color="#FF2E93" color2="#FF8A00" bite /></motion.div>
          {[0, 1, 2].map((i) => (
            <motion.div key={i} className="absolute" style={{ left: `${25 + i * 22}%`, top: '70%' }} animate={{ y: [0, 90], opacity: [1, 0] }} transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.5, ease: 'easeIn' }}><Drop className="w-4" color="#FF2E93" /></motion.div>
          ))}
          <div className="mx-auto -mt-2 h-4 w-44 rounded-[50%] bg-pink/40 blur-[2px]" />
        </div>
        <h1 className="display mt-10 text-6xl text-grape md:text-8xl">UH OH.<br /><span className="text-pink">THIS POP MELTED.</span></h1>
        <p className="mt-4 font-semibold text-muted">The page you're looking for doesn't exist (anymore).</p>
        <Link to="/" className="btn btn-primary btn-lg mt-8">TAKE ME HOME 🍧</Link>
      </div>
    </div>
  );
}
