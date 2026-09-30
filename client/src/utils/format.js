export const inr = (n, { decimals } = {}) => {
  const v = Number(n || 0);
  const d = decimals ?? (Number.isInteger(v) ? 0 : 2);
  return `₹${v.toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d })}`;
};
export const fmtDate = (d, opts = { day: 'numeric', month: 'short', year: 'numeric' }) => (d ? new Date(d).toLocaleDateString('en-IN', opts) : '');
export const fmtDateTime = (d) => (d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '');
export const pct = (mrp, price) => (mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0);
export const titleCase = (s = '') => s.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export const STATUS_LABEL = {
  pending: 'Awaiting payment', confirmed: 'Confirmed', processing: 'Processing', packed: 'Packed', shipped: 'Shipped',
  out_for_delivery: 'Out for delivery', delivered: 'Delivered', cancelled: 'Cancelled', refunded: 'Refunded',
};
export const PAYMENT_LABEL = {
  pending: 'Unpaid', paid: 'Paid', failed: 'Failed', refunded: 'Refunded', partially_refunded: 'Part refunded', cod_pending: 'COD — to collect', cod_collected: 'COD collected',
};
export const STATUS_COLOR = {
  pending: 'bg-lemon', confirmed: 'bg-sky', processing: 'bg-sky', packed: 'bg-violet text-white', shipped: 'bg-orange text-white',
  out_for_delivery: 'bg-pink text-white', delivered: 'bg-lime', cancelled: 'bg-ink/10', refunded: 'bg-ink text-white',
};

// flavour → palette fallback (used when a product has no colours set)
export const FLAVOUR_COLORS = {
  'lemon-lime': { from: '#D7FF3A', to: '#7ED321', ink: '#1F3D00' },
  orange: { from: '#FFB800', to: '#FF5E00', ink: '#4A1A00' },
  cranberry: { from: '#FF4FB8', to: '#E0115F', ink: '#4D0020' },
  'kala-khatta': { from: '#9B4DFF', to: '#4B0FA8', ink: '#1C0A3D' },
};
export const colorsFor = (p) => (p?.colors?.from ? p.colors : FLAVOUR_COLORS[p?.flavour] || { from: '#FF2E93', to: '#7B2FF7', ink: '#1C0A3D' });
export const gradient = (c, angle = 135) => `linear-gradient(${angle}deg, ${c.from}, ${c.to})`;
// light flavours need dark text
export const isLight = (hex = '#000') => {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return (r * 299 + g * 587 + b * 114) / 1000 > 170;
};
