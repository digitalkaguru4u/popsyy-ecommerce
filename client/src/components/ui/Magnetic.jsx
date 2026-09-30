import { useRef } from 'react';
import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion';
import useMedia from '../../hooks/useMedia';

// Pulls its child toward the cursor on desktop — the "magnetic button" effect
export default function Magnetic({ children, strength = 0.35, className = '' }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const fine = useMedia('(pointer: fine)');
  const x = useSpring(useMotionValue(0), { stiffness: 250, damping: 15, mass: 0.3 });
  const y = useSpring(useMotionValue(0), { stiffness: 250, damping: 15, mass: 0.3 });
  if (reduce || !fine) return <span className={`inline-block ${className}`}>{children}</span>;
  return (
    <motion.span ref={ref} className={`inline-block ${className}`} style={{ x, y }}
      onMouseMove={(e) => { const r = ref.current.getBoundingClientRect(); x.set((e.clientX - r.left - r.width / 2) * strength); y.set((e.clientY - r.top - r.height / 2) * strength); }}
      onMouseLeave={() => { x.set(0); y.set(0); }}>
      {children}
    </motion.span>
  );
}
