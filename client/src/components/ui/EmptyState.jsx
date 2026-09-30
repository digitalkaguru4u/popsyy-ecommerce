import { Link } from 'react-router-dom';
import PopArt from '../product/PopArt';
export default function EmptyState({ title = 'NOTHING HERE… YET.', text, cta = 'SHOP POPS', to = '/shop', color = '#FF2E93' }) {
  return (
    <div className="flex flex-col items-center px-4 py-14 text-center">
      <div className="w-24 animate-float [--r:-10deg]"><PopArt color={color} /></div>
      <h3 className="display mt-6 text-3xl text-grape">{title}</h3>
      {text && <p className="mt-2 max-w-sm text-muted">{text}</p>}
      {cta && <Link to={to} className="btn btn-primary mt-6">{cta}</Link>}
    </div>
  );
}
