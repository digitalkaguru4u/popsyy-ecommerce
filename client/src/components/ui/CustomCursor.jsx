import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion';
import useMedia from '../../hooks/useMedia';

// Desktop-only blob cursor that grows over interactive elements
export default function CustomCursor() {
  const fine = useMedia('(pointer: fine) and (min-width: 1024px)');
  const reduce = useReducedMotion();
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 500, damping: 40, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 500, damping: 40, mass: 0.4 });
  const [hover, setHover] = useState(false);
  const enabled = fine && !reduce;
  useEffect(() => {
    if (!enabled) return undefined;
    const move = (e) => { x.set(e.clientX); y.set(e.clientY); };
    const over = (e) => setHover(Boolean(e.target.closest?.('a,button,[role=button],input,select,textarea,label')));
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerover', over, { passive: true });
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerover', over); };
  }, [enabled, x, y]);
  if (!enabled) return null;
  return (
    <motion.div aria-hidden className="pointer-events-none fixed left-0 top-0 z-[200] rounded-full mix-blend-difference" style={{ x: sx, y: sy, translateX: '-50%', translateY: '-50%' }}
      animate={{ width: hover ? 56 : 16, height: hover ? 56 : 16, backgroundColor: hover ? '#D7FF3A' : '#FFFFFF' }} transition={{ type: 'spring', stiffness: 400, damping: 28 }} />
  );
}
