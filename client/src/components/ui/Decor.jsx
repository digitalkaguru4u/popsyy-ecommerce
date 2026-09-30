// Hand-built brand decorations: fruit, ice, drops, stickers. Pure SVG, no image requests.
export const LimeSlice = ({ className = '', style }) => (
  <svg viewBox="0 0 100 100" className={className} style={style} aria-hidden="true">
    <circle cx="50" cy="50" r="46" fill="#3E8E0B" stroke="#1c0a3d" strokeWidth="3" /><circle cx="50" cy="50" r="40" fill="#E9FFC2" /><circle cx="50" cy="50" r="36" fill="#A6E22E" />
    {[...Array(8)].map((_, i) => <line key={i} x1="50" y1="50" x2={50 + 33 * Math.cos((i * Math.PI) / 4)} y2={50 + 33 * Math.sin((i * Math.PI) / 4)} stroke="#E9FFC2" strokeWidth="3.5" strokeLinecap="round" />)}
  </svg>
);
export const OrangeSlice = ({ className = '', style }) => (
  <svg viewBox="0 0 100 100" className={className} style={style} aria-hidden="true">
    <circle cx="50" cy="50" r="46" fill="#F77F00" stroke="#1c0a3d" strokeWidth="3" /><circle cx="50" cy="50" r="40" fill="#FFE8B8" /><circle cx="50" cy="50" r="36" fill="#FF9F1C" />
    {[...Array(10)].map((_, i) => <line key={i} x1="50" y1="50" x2={50 + 34 * Math.cos((i * Math.PI) / 5)} y2={50 + 34 * Math.sin((i * Math.PI) / 5)} stroke="#FFE8B8" strokeWidth="3.5" strokeLinecap="round" />)}
  </svg>
);
export const Berry = ({ className = '', style, color = '#C2105A', shine = '#FF8AB8' }) => (
  <svg viewBox="0 0 60 60" className={className} style={style} aria-hidden="true">
    <circle cx="30" cy="32" r="24" fill={color} stroke="#1c0a3d" strokeWidth="3" /><ellipse cx="22" cy="23" rx="7" ry="5" fill={shine} opacity=".8" /><path d="M26 8q4 4 8 0" stroke="#1c0a3d" strokeWidth="3" fill="none" strokeLinecap="round" />
  </svg>
);
export const Jamun = (p) => <Berry {...p} color="#3A0F66" shine="#9C7BE0" />;
export const IceCube = ({ className = '', style }) => (
  <svg viewBox="0 0 80 80" className={className} style={style} aria-hidden="true">
    <rect x="8" y="8" width="64" height="64" rx="14" fill="#E6F7FF" fillOpacity=".85" stroke="#1c0a3d" strokeWidth="3" />
    <path d="M20 22q6-6 16-6" stroke="#fff" strokeWidth="5" strokeLinecap="round" fill="none" /><path d="M56 58q-6 4-12 4" stroke="#9BDFFF" strokeWidth="4" strokeLinecap="round" fill="none" />
  </svg>
);
export const Drop = ({ className = '', style, color = '#5CD3FF' }) => (
  <svg viewBox="0 0 40 56" className={className} style={style} aria-hidden="true">
    <path d="M20 3C28 16 36 26 36 36a16 16 0 1 1-32 0C4 26 12 16 20 3z" fill={color} stroke="#1c0a3d" strokeWidth="3" /><ellipse cx="14" cy="36" rx="4" ry="6" fill="#fff" opacity=".7" />
  </svg>
);
export const Leaf = ({ className = '', style }) => (
  <svg viewBox="0 0 60 40" className={className} style={style} aria-hidden="true"><path d="M4 30Q20 0 56 6Q40 38 4 30z" fill="#2E9E44" stroke="#1c0a3d" strokeWidth="3" /><path d="M10 28Q28 18 48 10" stroke="#8BE39B" strokeWidth="2.5" fill="none" /></svg>
);
export const Burst = ({ className = '', style, color = '#FFE14D', children, textClass = '' }) => (
  <span className={`${/\b(absolute|fixed)\b/.test(className) ? '' : 'relative'} inline-grid place-items-center ${className}`} style={style}>
    <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden="true">
      <path d={[...Array(24)].map((_, i) => { const r = i % 2 ? 40 : 49; const a = (i * Math.PI) / 12; return `${i ? 'L' : 'M'}${50 + r * Math.cos(a)} ${50 + r * Math.sin(a)}`; }).join(' ') + 'Z'} fill={color} stroke="#1c0a3d" strokeWidth="3" />
    </svg>
    <span className={`relative text-center font-display font-extrabold uppercase leading-none ${textClass}`}>{children}</span>
  </span>
);
export const Squiggle = ({ className = '', color = '#FF2E93' }) => (
  <svg viewBox="0 0 200 20" className={className} aria-hidden="true" preserveAspectRatio="none"><path d="M2 12 Q 17 2, 32 12 T 62 12 T 92 12 T 122 12 T 152 12 T 182 12 T 198 10" stroke={color} strokeWidth="5" fill="none" strokeLinecap="round" /></svg>
);
export const Sparkle = ({ className = '', color = '#fff' }) => (
  <svg viewBox="0 0 40 40" className={className} aria-hidden="true"><path d="M20 2 L24 16 L38 20 L24 24 L20 38 L16 24 L2 20 L16 16Z" fill={color} stroke="#1c0a3d" strokeWidth="2.5" strokeLinejoin="round" /></svg>
);

export const FRUIT_FOR = {
  'lemon-lime': LimeSlice,
  orange: OrangeSlice,
  cranberry: Berry,
  'kala-khatta': Jamun,
};
