import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader, SearchBox, Table, Pager } from './ui';
import { useFetch } from '../../hooks/useFetch';
import useDebounce from '../../hooks/useDebounce';
import { qs } from '../../services/api';
import { fmtDate, inr } from '../../utils/format';

export default function Customers() {
  const [search, setSearch] = useState('');
  const [blocked, setBlocked] = useState(false);
  const [page, setPage] = useState(1);
  const ds = useDebounce(search);
  const { data } = useFetch(`/admin/customers${qs({ search: ds, blocked: blocked ? 'true' : '', page })}`, { ttl: 0 });
  return (
    <div>
      <PageHeader title="CUSTOMERS" sub={`${data?.total ?? '…'} customers`}>
        <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Name, email, phone" />
        <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={blocked} onChange={(e) => { setBlocked(e.target.checked); setPage(1); }} className="h-4 w-4" /> Blocked only</label>
      </PageHeader>
      <Table head={['Customer', 'Phone', 'Joined', 'Orders', 'Spent', 'Status']} empty={data && !data.customers.length ? 'No customers.' : null}>
        {data?.customers.map((c) => (
          <tr key={c._id} className="hover:bg-cream/60">
            <td className="px-4 py-3"><Link to={`/admin/customers/${c._id}`} className="font-extrabold hover:underline">{c.name}</Link><p className="text-xs text-muted">{c.email}</p></td>
            <td className="px-4 py-3">{c.phone || '—'}</td>
            <td className="px-4 py-3">{fmtDate(c.createdAt)}</td>
            <td className="px-4 py-3">{c.orders}</td>
            <td className="px-4 py-3 font-bold">{inr(c.spent)}</td>
            <td className="px-4 py-3">{c.isBlocked ? <span className="rounded-full bg-magenta px-2 py-0.5 text-[11px] font-extrabold uppercase text-white">Blocked</span> : <span className="text-xs font-bold text-leaf">Active</span>}</td>
          </tr>
        ))}
      </Table>
      <Pager page={page} pages={data?.pages} onPage={setPage} />
    </div>
  );
}
