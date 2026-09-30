import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, LabelList } from 'recharts';
import { ChartTip, FLAVOUR_CHART, SERIES } from './ui';

const axis = { stroke: '#1c0a3d', strokeOpacity: 0.25, tick: { fill: '#6B5A8E', fontSize: 11, fontWeight: 600 }, tickLine: false };
const shortDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
const kfmt = (v) => (v >= 1000 ? `₹${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k` : `₹${v}`);

export function RevenueArea({ data, dataKey = 'revenue', name = 'Revenue', money = true, color = SERIES, height = 240 }) {
  return (
    <div style={{ height }} role="img" aria-label={`${name} over time`}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs><linearGradient id={`g-${dataKey}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={color} stopOpacity={0.25} /><stop offset="1" stopColor={color} stopOpacity={0} /></linearGradient></defs>
          <CartesianGrid vertical={false} stroke="#1c0a3d" strokeOpacity={0.07} />
          <XAxis dataKey="date" tickFormatter={shortDate} {...axis} minTickGap={24} />
          <YAxis {...axis} width={48} tickFormatter={money ? kfmt : undefined} allowDecimals={false} />
          <Tooltip content={<ChartTip money={money} />} labelFormatter={shortDate} cursor={{ stroke: '#1c0a3d', strokeOpacity: 0.3 }} />
          <Area type="monotone" dataKey={dataKey} name={name} stroke={color} strokeWidth={2} fill={`url(#g-${dataKey})`} activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CountBars({ data, dataKey = 'orders', name = 'Orders', color = SERIES, height = 200 }) {
  return (
    <div style={{ height }} role="img" aria-label={`${name} per day`}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#1c0a3d" strokeOpacity={0.07} />
          <XAxis dataKey="date" tickFormatter={shortDate} {...axis} minTickGap={24} />
          <YAxis {...axis} width={32} allowDecimals={false} />
          <Tooltip content={<ChartTip />} labelFormatter={shortDate} cursor={{ fill: '#1c0a3d', fillOpacity: 0.05 }} />
          <Bar dataKey={dataKey} name={name} fill={color} radius={[4, 4, 0, 0]} maxBarSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Horizontal bars, category name on the axis (identity never colour-alone), value labels at the bar end
export function BreakdownBars({ data, valueKey = 'revenue', money = true, byFlavour = false }) {
  const rows = (data || []).map((d) => ({ ...d, label: d.name }));
  const h = Math.max(120, rows.length * 44);
  return (
    <div style={{ height: h }} role="img" aria-label="Sales breakdown">
      <ResponsiveContainer>
        <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 64, left: 8, bottom: 0 }}>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="label" {...axis} axisLine={false} width={96} tick={{ fill: '#1c0a3d', fontSize: 12, fontWeight: 800 }} />
          <Tooltip content={<ChartTip money={money} />} cursor={{ fill: '#1c0a3d', fillOpacity: 0.05 }} />
          <Bar dataKey={valueKey} name={money ? 'Revenue' : 'Pops'} radius={[0, 4, 4, 0]} maxBarSize={26}>
            {rows.map((r) => <Cell key={r.key} fill={byFlavour ? FLAVOUR_CHART[r.key] || SERIES : SERIES} />)}
            <LabelList dataKey={valueKey} position="right" formatter={(v) => (money ? `₹${Number(v).toLocaleString('en-IN')}` : Number(v).toLocaleString('en-IN'))} style={{ fill: '#1c0a3d', fontSize: 12, fontWeight: 700 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
