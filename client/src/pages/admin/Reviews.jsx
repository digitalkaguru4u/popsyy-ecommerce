import { useState } from 'react';
import { Check, X, Star, Trash2 } from 'lucide-react';
import { PageHeader, Pager } from './ui';
import Stars from '../../components/ui/Stars';
import { useFetch } from '../../hooks/useFetch';
import { api, assetUrl, qs } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { fmtDate } from '../../utils/format';

export default function Reviews() {
  const toast = useToast();
  const [status, setStatus] = useState('pending');
  const [page, setPage] = useState(1);
  const { data, reload } = useFetch(`/admin/reviews${qs({ status, page })}`, { ttl: 0 });
  const act = async (r, body) => { try { await api.put(`/admin/reviews/${r._id}`, body); reload(); } catch (e) { toast.error(e.message); } };
  const del = async (r) => { if (!window.confirm('Delete this review permanently?')) return; try { await api.del(`/admin/reviews/${r._id}`); reload(); } catch (e) { toast.error(e.message); } };
  return (
    <div>
      <PageHeader title="REVIEWS" sub="Approved reviews count toward product ratings. Featured ones appear on the homepage.">
        <div className="flex rounded-full border-[3px] border-ink bg-white p-1">{[['pending', 'Pending'], ['approved', 'Approved'], ['rejected', 'Rejected'], ['', 'All']].map(([v, l]) => <button key={l} onClick={() => { setStatus(v); setPage(1); }} className={`rounded-full px-3 py-1.5 text-xs font-extrabold uppercase ${status === v ? 'bg-ink text-white' : ''}`}>{l}</button>)}</div>
      </PageHeader>
      <div className="grid gap-4 lg:grid-cols-2">
        {data?.reviews.map((r) => (
          <article key={r._id} className="rounded-3xl border-[3px] border-ink bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-2"><Stars value={r.rating} /><span className="text-xs text-muted">{fmtDate(r.createdAt)}</span></div>
            <p className="mt-2 text-xs font-extrabold uppercase text-purple">{r.product?.name}</p>
            {r.title && <h3 className="font-display text-lg font-extrabold">{r.title}</h3>}
            <p className="mt-1 text-sm">{r.body}</p>
            {r.images?.length > 0 && <div className="mt-2 flex gap-2">{r.images.map((u) => <a key={u} href={assetUrl(u)} target="_blank" rel="noreferrer"><img src={assetUrl(u)} alt="" className="h-14 w-14 rounded-lg border-2 border-ink object-cover" /></a>)}</div>}
            <p className="mt-2 text-xs font-semibold text-muted">{r.authorName} {r.user?.email ? `· ${r.user.email}` : ''} {r.isVerifiedPurchase && '· ✓ verified buyer'} {r.isSample && '· SAMPLE (seeded — delete before launch)'}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {r.status !== 'approved' && <button onClick={() => act(r, { status: 'approved' })} className="btn btn-sm btn-lime"><Check className="h-4 w-4" /> Approve</button>}
              {r.status !== 'rejected' && <button onClick={() => act(r, { status: 'rejected' })} className="btn btn-sm btn-light"><X className="h-4 w-4" /> Reject</button>}
              {r.status === 'approved' && <button onClick={() => act(r, { isFeatured: !r.isFeatured })} className={`btn btn-sm ${r.isFeatured ? 'btn-dark' : 'btn-light'}`}><Star className="h-4 w-4" /> {r.isFeatured ? 'Featured' : 'Feature'}</button>}
              <button onClick={() => del(r)} className="btn btn-sm btn-light text-magenta"><Trash2 className="h-4 w-4" /></button>
            </div>
          </article>
        ))}
      </div>
      {data && !data.reviews.length && <p className="rounded-3xl border-[3px] border-dashed border-ink/30 p-10 text-center font-bold text-muted">Nothing here.</p>}
      <Pager page={page} pages={data?.pages} onPage={setPage} />
    </div>
  );
}
