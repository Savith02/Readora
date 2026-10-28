import { useId, useState } from 'react';
import { BarChart3, TrendingUp } from 'lucide-react';
import Card from '../../components/ui/Card';

export type Series = { month: string; count: number }[];
const monthLabel = (month: string, long = false) => new Date(`${month}-01T00:00:00Z`).toLocaleDateString(undefined, { month: long ? 'long' : 'short', ...(long ? { year: 'numeric' as const } : {}), timeZone: 'UTC' });

export default function AdminChart({ title, description, rows, variant = 'bar' }: { title: string; description: string; rows: Series; variant?: 'bar' | 'line' }) {
  const id = useId();
  const [hovered, setHovered] = useState<number | null>(null);
  const selected = hovered !== null && hovered < rows.length ? rows[hovered] : null;
  const max = Math.max(...rows.map(row => row.count), 1);
  const ceiling = max < 4 ? 4 : Math.ceil(max / 4) * 4;
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  const chart = { width: 640, height: 224, left: 40, right: 14, top: 18, bottom: 196 };
  const plotWidth = chart.width - chart.left - chart.right;
  const plotHeight = chart.bottom - chart.top;
  const step = plotWidth / Math.max(rows.length, 1);
  const x = (index: number) => chart.left + step * (index + 0.5);
  const y = (count: number) => chart.bottom - count / ceiling * plotHeight;
  const points = rows.map((row, i) => `${x(i)},${y(row.count)}`).join(' ');
  const area = rows.length ? `M ${x(0)} ${chart.bottom} L ${rows.map((row, i) => `${x(i)} ${y(row.count)}`).join(' L ')} L ${x(rows.length - 1)} ${chart.bottom} Z` : '';
  const Icon = variant === 'bar' ? BarChart3 : TrendingUp;

  return <Card className="min-w-0 border-muted-line/60 !p-5 sm:!p-6">
    <div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-semibold">{title}</h2><p className="mt-1 max-w-sm text-xs leading-relaxed text-muted">{description}</p></div><span className="rounded-lg bg-accent/10 p-2 text-accent"><Icon size={17} aria-hidden="true" /></span></div>
    <div className="mt-5 flex flex-wrap items-baseline justify-between gap-2"><p className="text-2xl font-semibold tabular-nums">{total.toLocaleString()} <span className="text-xs font-normal text-muted">{variant === 'bar' ? 'registrations' : 'reward events'}</span></p><span className="flex items-center gap-2 text-[10px] text-muted"><span className="h-1.5 w-1.5 rounded-full bg-accent" />{variant === 'bar' ? 'New readers' : 'Page-read events'}</span></div>
    {total === 0 ? <div className="mt-5 flex h-52 flex-col items-center justify-center rounded-xl border border-dashed border-muted-line/80 bg-surface/50 px-5 text-center"><Icon size={25} strokeWidth={1.4} className="mb-3 text-muted" aria-hidden="true" /><p className="text-sm font-medium">{variant === 'bar' ? 'No registrations in this period' : 'Your reading story starts here'}</p><p className="mt-2 max-w-xs text-xs leading-relaxed text-muted">{variant === 'bar' ? 'New reader registrations will appear here when recorded.' : 'Recorded page-read reward events will appear here as your community reads.'}</p></div> : <div className="relative mt-5" onMouseLeave={() => setHovered(null)}>
      <svg viewBox={`0 0 ${chart.width} ${chart.height}`} className="block w-full overflow-visible" role="group" aria-label={`${title}: monthly counts. Use Tab to explore individual months.`}>
        <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="rgb(var(--accent))" stopOpacity="0.25" /><stop offset="100%" stopColor="rgb(var(--accent))" stopOpacity="0.01" /></linearGradient></defs>
        {[0, 1, 2, 3, 4].map(tick => <g key={tick}><line x1={chart.left} x2={chart.width - chart.right} y1={y(ceiling * tick / 4)} y2={y(ceiling * tick / 4)} stroke="rgb(var(--muted-line))" strokeOpacity="0.55" strokeDasharray={tick ? '3 5' : undefined} /><text x={chart.left - 10} y={y(ceiling * tick / 4) + 4} textAnchor="end" fontSize="10" fill="rgb(var(--muted))">{Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(ceiling * tick / 4)}</text></g>)}
        {variant === 'line' && <><path d={area} fill={`url(#${id})`} /><polyline points={points} fill="none" stroke="rgb(var(--accent))" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" /></>}
        {rows.map((row, i) => <g key={row.month}>
          {variant === 'bar' ? <rect x={x(i) - Math.min(step * 0.28, 20)} y={y(row.count)} width={Math.min(step * 0.56, 40)} height={row.count ? chart.bottom - y(row.count) : 0} rx="4" fill="rgb(var(--accent))" opacity={hovered === null || hovered === i ? '0.9' : '0.4'} /> : <circle cx={x(i)} cy={y(row.count)} r={hovered === i ? 5 : 3} fill="rgb(var(--surface-raised))" stroke="rgb(var(--accent))" strokeWidth="2" />}
          <text x={x(i)} y={chart.height - 5} textAnchor="middle" fontSize="11" fill="rgb(var(--muted))">{monthLabel(row.month)}</text>
          <rect x={chart.left + step * i} y={chart.top} width={step} height={plotHeight} fill="transparent" tabIndex={0} role="img" aria-label={`${monthLabel(row.month, true)}: ${row.count.toLocaleString()} ${variant === 'bar' ? 'registrations' : 'reward events'}`} onMouseEnter={() => setHovered(i)} onFocus={() => setHovered(i)} onBlur={() => setHovered(null)} className="cursor-crosshair focus:stroke-accent" style={{ outline: 'none' }}><title>{`${monthLabel(row.month, true)}: ${row.count.toLocaleString()}`}</title></rect>
        </g>)}
      </svg>
      {selected && hovered !== null && <div role="status" className="pointer-events-none absolute top-0 z-10 w-36 rounded-lg border border-accent/30 bg-surface-sunken px-3 py-2 text-xs shadow-lift" style={{ left: `${Math.min(Math.max(x(hovered) / chart.width * 100, 16), 84)}%`, transform: 'translateX(-50%)' }}><p className="text-muted">{monthLabel(selected.month, true)}</p><p className="mt-1 font-semibold text-accent">{selected.count.toLocaleString()} {variant === 'bar' ? 'registrations' : 'events'}</p></div>}
    </div>}
    <div className="mt-4 flex items-start justify-between gap-3 border-t border-muted-line/50 pt-3"><span className="pt-0.5 text-[10px] text-muted">UTC calendar months</span><details className="text-right text-[11px] text-muted"><summary className="cursor-pointer rounded hover:text-accent">View data</summary><table className="mt-3 text-left text-xs"><caption className="sr-only">{title} monthly data</caption><thead><tr><th scope="col" className="pr-5 pb-2 font-medium">Month</th><th scope="col" className="pb-2 text-right font-medium">Count</th></tr></thead><tbody>{rows.map(row => <tr key={row.month}><td className="py-1 pr-5">{monthLabel(row.month, true)}</td><td className="text-right tabular-nums">{row.count.toLocaleString()}</td></tr>)}</tbody></table></details></div>
  </Card>;
}
