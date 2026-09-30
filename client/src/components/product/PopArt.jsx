// Simple vector popsicle used for loaders, empty states and fallbacks
export default function PopArt({ color = '#FF2E93', color2, className = '', bite = false }) {
  const id = `pa${color.replace('#', '')}${(color2 || '').replace('#', '')}`;
  return (
    <svg viewBox="0 0 100 170" className={className} aria-hidden="true">
      <defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={color} /><stop offset="1" stopColor={color2 || color} /></linearGradient></defs>
      <rect x="40" y="118" width="20" height="50" rx="10" fill="#E9C58F" stroke="#1c0a3d" strokeWidth="4" />
      <path d={bite ? 'M10 30Q10 6 34 6H56Q64 14 72 8Q90 10 90 30V112Q90 124 78 124H22Q10 124 10 112Z' : 'M10 30Q10 6 34 6H66Q90 6 90 30V112Q90 124 78 124H22Q10 124 10 112Z'} fill={`url(#${id})`} stroke="#1c0a3d" strokeWidth="4" />
      <path d="M24 26V104" stroke="#fff" strokeOpacity=".6" strokeWidth="7" strokeLinecap="round" />
    </svg>
  );
}
