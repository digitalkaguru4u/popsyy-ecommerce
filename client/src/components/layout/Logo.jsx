export default function Logo({ className = '', light = false }) {
  return (
    <span className={`inline-flex items-center gap-1.5 font-display text-[24px] sm:text-[28px] font-extrabold leading-none tracking-tight ${light ? 'text-white' : 'text-grape'} ${className}`}>
      <svg viewBox="0 0 28 44" className="h-8 w-5 -rotate-12" aria-hidden="true"><rect x="11" y="30" width="6" height="14" rx="3" fill="#E9C58F" stroke="#1c0a3d" strokeWidth="2" /><path d="M3 9Q3 2 10 2h8q7 0 7 7v19q0 4-4 4H7q-4 0-4-4z" fill="#FF2E93" stroke="#1c0a3d" strokeWidth="2.5" /><path d="M3 18h22v10q0 4-4 4H7q-4 0-4-4z" fill="#FF8A00" /><path d="M3 18h22" stroke="#1c0a3d" strokeWidth="0" /><path d="M8 8v16" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" opacity=".7" /></svg>
      POPSYY
    </span>
  );
}
