import { useEffect, useState } from 'react';
import ProductCard from '../../components/product/ProductCard';
import EmptyState from '../../components/ui/EmptyState';
import { CardSkeleton } from '../../components/ui/Skeleton';
import { api, qs } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function Wishlist() {
  const { wishlist } = useAuth();
  const [products, setProducts] = useState(null);
  useEffect(() => {
    // fetch full product data (with variants) for the saved ids
    api.get(`/products${qs({ limit: 100 })}`).then((r) => setProducts(r.products.filter((p) => wishlist.includes(String(p._id))))).catch(() => setProducts([]));
  }, [wishlist]);
  if (!products) return <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3"><CardSkeleton /><CardSkeleton /></div>;
  if (!products.length) return <EmptyState title="NO CRUSHES YET." text="Tap the heart on any pop to save it here." color="#9B4DFF" />;
  return <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">{products.map((p, i) => <ProductCard key={p._id} product={p} index={i} />)}</div>;
}
