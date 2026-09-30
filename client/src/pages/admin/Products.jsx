import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { PageHeader, SearchBox, Table, Toggle, Pager } from './ui';
import ProductImage from '../../components/product/ProductImage';
import { useFetch } from '../../hooks/useFetch';
import useDebounce from '../../hooks/useDebounce';
import { api, qs } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { colorsFor, gradient, inr } from '../../utils/format';

export default function Products() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const ds = useDebounce(search);
  const { data, reload } = useFetch(`/admin/products${qs({ search: ds, status, page })}`, { ttl: 0 });
  const toggle = async (p) => { try { await api.patch(`/admin/products/${p._id}/toggle`, { isActive: !p.isActive }); reload(); } catch (e) { toast.error(e.message); } };
  const remove = async (p) => {
    if (!window.confirm(`Delete ${p.name}? Products with orders are deactivated instead.`)) return;
    try { const r = await api.del(`/admin/products/${p._id}`); toast.success(r.message || 'Deleted'); reload(); } catch (e) { toast.error(e.message); }
  };
  return (
    <div>
      <PageHeader title="PRODUCTS" sub={`${data?.total ?? '…'} products · stock is counted in individual pops`}>
        <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search products" />
        <select className="input w-auto py-2 text-sm" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="Status"><option value="">All</option><option value="active">Active</option><option value="inactive">Inactive</option></select>
        <Link to="/admin/products/new" className="btn btn-primary btn-sm"><Plus className="h-4 w-4" /> New product</Link>
      </PageHeader>
      <Table head={['Product', 'Packs', 'From', 'Stock', 'Sold', 'Rating', 'Active', '']} empty={data && !data.products.length ? 'No products.' : null}>
        {data?.products.map((p) => (
          <tr key={p._id} className="hover:bg-cream/60">
            <td className="px-4 py-3"><div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-xl border-2 border-ink" style={{ background: gradient(colorsFor(p)) }}><ProductImage product={p} className="h-10 w-auto" /></span><span><Link to={`/admin/products/${p._id}`} className="font-extrabold hover:underline">{p.name}</Link><span className="block text-xs text-muted">/{p.slug}</span></span></div></td>
            <td className="px-4 py-3 text-xs font-semibold">{p.variants.map((v) => v.packSize).join(' · ')}</td>
            <td className="px-4 py-3 font-bold">{inr(p.price)}</td>
            <td className={`px-4 py-3 font-bold ${p.stock <= 0 ? 'text-magenta' : p.stock <= p.lowStockThreshold ? 'text-orange' : ''}`}>{p.stock}</td>
            <td className="px-4 py-3">{p.soldCount}</td>
            <td className="px-4 py-3">{p.ratingAvg?.toFixed(1)} ({p.ratingCount})</td>
            <td className="px-4 py-3"><Toggle checked={p.isActive} onChange={() => toggle(p)} /></td>
            <td className="px-4 py-3"><div className="flex justify-end gap-1"><Link to={`/admin/products/${p._id}`} className="grid h-8 w-8 place-items-center rounded-full hover:bg-lemon" aria-label="Edit"><Pencil className="h-4 w-4" /></Link><button onClick={() => remove(p)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-pink hover:text-white" aria-label="Delete"><Trash2 className="h-4 w-4" /></button></div></td>
          </tr>
        ))}
      </Table>
      <Pager page={page} pages={data?.pages} onPage={setPage} />
    </div>
  );
}
