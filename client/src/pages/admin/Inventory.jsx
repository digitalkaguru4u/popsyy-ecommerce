import { useState } from 'react';
import { PageHeader, Panel, Stat, Table, Pager } from './ui';
import Modal from '../../components/ui/Modal';
import Field from '../../components/ui/Field';
import Spinner from '../../components/ui/Spinner';
import { useFetch } from '../../hooks/useFetch';
import { api, qs } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { fmtDateTime } from '../../utils/format';

export default function Inventory() {
  const toast = useToast();
  const { data, reload } = useFetch('/admin/inventory', { ttl: 0 });
  const [hPage, setHPage] = useState(1);
  const [hProduct, setHProduct] = useState('');
  const hist = useFetch(`/admin/inventory/history${qs({ page: hPage, product: hProduct })}`, { ttl: 0 });
  const [adj, setAdj] = useState(null);
  const [bulk, setBulk] = useState(null);
  const [saving, setSaving] = useState(false);

  const saveAdj = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await api.post('/admin/inventory/adjust', { productId: adj.product._id, mode: adj.mode, quantity: Number(adj.quantity), note: adj.note }); toast.success('Stock updated'); setAdj(null); reload(); hist.reload(); } catch (err) { toast.error(err.message); } finally { setSaving(false); }
  };
  const saveBulk = async () => {
    setSaving(true);
    try {
      const items = Object.entries(bulk).filter(([id, v]) => v !== '' && Number(v) !== data.products.find((p) => p._id === id)?.stock).map(([productId, stock]) => ({ productId, stock: Number(stock) }));
      if (!items.length) { setBulk(null); return; }
      await api.post('/admin/inventory/bulk', { items, note: 'Bulk stock update' });
      toast.success(`${items.length} product(s) updated`); setBulk(null); reload(); hist.reload();
    } catch (err) { toast.error(err.message); } finally { setSaving(false); }
  };
  const t = data?.totals;
  return (
    <div className="space-y-6">
      <PageHeader title="INVENTORY" sub="Stock is counted in individual pops. Orders deduct on confirmation; cancellations restore.">
        {bulk ? <><button onClick={() => setBulk(null)} className="btn btn-light btn-sm">Cancel</button><button onClick={saveBulk} disabled={saving} className="btn btn-primary btn-sm">{saving ? <Spinner className="h-4 w-4" /> : 'Save all'}</button></> : <button onClick={() => setBulk(Object.fromEntries(data.products.map((p) => [p._id, String(p.stock)])))} disabled={!data} className="btn btn-dark btn-sm">Bulk edit</button>}
      </PageHeader>
      {t && <div className="grid grid-cols-3 gap-3"><Stat label="Pops in stock" value={t.pops.toLocaleString('en-IN')} tone="bg-lime" /><Stat label="Low stock" value={t.low} tone={t.low ? 'bg-lemon' : 'bg-white'} /><Stat label="Out of stock" value={t.out} tone={t.out ? 'bg-[#FFC2E2]' : 'bg-white'} /></div>}
      <Table head={['Product', 'Stock (pops)', 'Alert at', 'Sold', 'State', '']}>
        {data?.products.map((p) => (
          <tr key={p._id}>
            <td className="px-4 py-3 font-extrabold"><span className="mr-2 inline-block h-3 w-3 rounded-full border-2 border-ink align-middle" style={{ background: p.colors?.from }} />{p.name}{!p.isActive && <span className="ml-2 text-xs text-muted">(inactive)</span>}</td>
            <td className="px-4 py-3">{bulk ? <input type="number" min={0} aria-label={`Stock for ${p.name}`} className="input w-28 py-1.5" value={bulk[p._id]} onChange={(e) => setBulk({ ...bulk, [p._id]: e.target.value })} /> : <span className="font-display text-lg font-extrabold">{p.stock}</span>}</td>
            <td className="px-4 py-3">{p.lowStockThreshold}</td>
            <td className="px-4 py-3">{p.soldCount}</td>
            <td className="px-4 py-3"><span className={`rounded-full border-2 border-ink px-2 py-0.5 text-[11px] font-extrabold uppercase ${p.state === 'out' ? 'bg-magenta text-white' : p.state === 'low' ? 'bg-lemon' : 'bg-lime'}`}>{p.state === 'out' ? 'Out of stock' : p.state === 'low' ? 'Low' : 'OK'}</span></td>
            <td className="px-4 py-3 text-right">{!bulk && <button onClick={() => setAdj({ product: p, mode: 'add', quantity: 100, note: '' })} className="btn btn-light btn-sm">Adjust</button>}</td>
          </tr>
        ))}
      </Table>
      <Panel title="Stock history" action={<select className="input w-auto py-1.5 text-sm" aria-label="Filter history by product" value={hProduct} onChange={(e) => { setHProduct(e.target.value); setHPage(1); }}><option value="">All products</option>{data?.products.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}</select>}>
        <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-sm"><thead className="text-left text-[11px] uppercase text-muted"><tr><th className="py-2">When</th><th>Product</th><th className="text-right">Change</th><th className="text-right">Balance</th><th>Reason</th><th>By / ref</th></tr></thead>
          <tbody>{hist.data?.history.map((h) => (
            <tr key={h._id} className="border-t border-ink/10"><td className="py-2 text-xs">{fmtDateTime(h.createdAt)}</td><td className="font-bold">{h.product?.name}</td><td className={`text-right font-bold ${h.change < 0 ? 'text-magenta' : 'text-leaf'}`}>{h.change > 0 ? '+' : ''}{h.change}</td><td className="text-right">{h.balance}</td><td className="uppercase text-xs font-bold">{h.reason.replace('_', ' ')}</td><td className="text-xs">{h.by?.name || h.order?.orderNumber || 'system'}{h.note ? ` · ${h.note}` : ''}</td></tr>
          ))}</tbody></table></div>
        <Pager page={hPage} pages={hist.data?.pages} onPage={setHPage} />
      </Panel>
      <Modal open={Boolean(adj)} onClose={() => setAdj(null)} title={`Adjust ${adj?.product.name || ''}`}>
        {adj && (
          <form onSubmit={saveAdj} className="space-y-4">
            <p className="text-sm font-bold">Current stock: {adj.product.stock} pops</p>
            <div className="grid grid-cols-3 gap-2">{[['add', 'Restock +'], ['remove', 'Remove −'], ['set', 'Set to']].map(([m, l]) => <button type="button" key={m} onClick={() => setAdj({ ...adj, mode: m })} className={`rounded-xl border-[3px] border-ink py-2 text-sm font-extrabold ${adj.mode === m ? 'bg-lime' : 'bg-white'}`}>{l}</button>)}</div>
            <Field label="Quantity (pops)"><input className="input" type="number" min={0} required value={adj.quantity} onChange={(e) => setAdj({ ...adj, quantity: e.target.value })} /></Field>
            <Field label="Note"><input className="input" placeholder="e.g. Batch #42 from factory, damaged in transit…" value={adj.note} onChange={(e) => setAdj({ ...adj, note: e.target.value })} /></Field>
            <button disabled={saving} className="btn btn-primary w-full">{saving ? <Spinner /> : 'Save'}</button>
          </form>
        )}
      </Modal>
    </div>
  );
}
