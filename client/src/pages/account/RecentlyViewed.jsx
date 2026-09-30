import { Link } from 'react-router-dom';
import ProductImage from '../../components/product/ProductImage';
import EmptyState from '../../components/ui/EmptyState';
import Skeleton from '../../components/ui/Skeleton';
import { useFetch } from '../../hooks/useFetch';
import { colorsFor, gradient, inr } from '../../utils/format';

export default function RecentlyViewed() {
  const { data, loading } = useFetch('/account/recently-viewed', { ttl: 0 });
  if (loading && !data) return <Skeleton className="h-40" />;
  if (!data?.products?.length) return <EmptyState title="NOTHING VIEWED YET." text="Go window-shop some flavours." />;
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {data.products.map((p) => (
        <Link key={p._id} to={`/product/${p.slug}`} className="sticker overflow-hidden bg-white transition hover:-translate-y-1">
          <div className="grid aspect-square place-items-center" style={{ background: gradient(colorsFor(p)) }}><ProductImage product={p} className="h-[85%] w-auto" /></div>
          <div className="p-3"><p className="font-display font-extrabold">{p.name}</p><p className="text-sm font-bold">{inr(p.price)}</p></div>
        </Link>
      ))}
    </div>
  );
}
