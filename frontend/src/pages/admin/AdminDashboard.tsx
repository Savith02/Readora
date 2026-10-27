import { useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Activity, ArrowRight, BookOpen, CalendarDays, CheckCheck, CircleAlert, Gamepad2, ListChecks, RefreshCw, Sparkles, Trophy, UserPlus, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Avatar from '../../components/layout/Avatar';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../api/client';
import { parseApiError } from '../../utils/apiError';
import AdminChart from './AdminChart';
import type { Series } from './AdminChart';
import { modulePath } from './AdminLayout';

interface DashboardData {
  generatedAt: string;
  stats: { books: number | null; users: number; activeReaders: number; games: number; tasks: number; points: number };
  growth: Series; reading: Series;
  popular: { _id: string; title: string; author: string; coverUrl?: string; count: number }[];
  recentUsers: { _id: string; name: string; email: string; createdAt: string }[];
  activity: { id: string; text: string; date: string }[];
  activeReaders: { _id: string; name: string; count: number }[];
}
const date = (value: string) => new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
const number = (value: number) => value.toLocaleString();
const cards = [
  { title: 'Total Books', key: 'books', icon: BookOpen, note: 'External catalog; stored book count unavailable' },
  { title: 'Total Registered Users', key: 'users', icon: Users, note: 'Registered reader accounts' },
  { title: 'Active Readers', key: 'activeReaders', icon: Activity, note: 'Unique readers in the last 30 days' },
  { title: 'Total Games Played', key: 'games', icon: Gamepad2, note: 'All recorded game results' },
  { title: 'Total Tasks Completed', key: 'tasks', icon: ListChecks, note: 'Successfully completed reading tasks' },
  { title: 'Total Points Earned', key: 'points', icon: Sparkles, note: 'Positive awards from the points ledger' },
] as const;
const actions = [
  { label: 'Manage Books', module: 'Manage Books', icon: BookOpen },
  { label: 'Manage Users', module: 'User Management', icon: Users },
  { label: 'Manage Games', module: 'Games Management', icon: Gamepad2 },
  { label: 'Manage Tasks', module: 'Tasks & Challenges', icon: ListChecks },
];
function Empty({ title, description, icon: Icon }: { title: string; description: string; icon: LucideIcon }) {
  return <div className="flex min-h-52 flex-col items-center justify-center px-5 py-8 text-center"><span className="mb-4 rounded-2xl border border-muted-line/70 bg-surface p-3.5 text-muted"><Icon size={24} strokeWidth={1.4} aria-hidden="true" /></span><p className="text-sm font-medium">{title}</p><p className="mt-2 max-w-xs text-xs leading-relaxed text-muted">{description}</p></div>;
}
function PanelHeading({ title, description, icon: Icon }: { title: string; description: string; icon: LucideIcon }) {
  return <div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-semibold">{title}</h2><p className="mt-1 text-xs leading-relaxed text-muted">{description}</p></div><Icon size={18} className="mt-1 shrink-0 text-muted" strokeWidth={1.6} aria-hidden="true" /></div>;
}
function BookThumbnail({ src }: { src?: string }) {
  const [failed, setFailed] = useState(false);
  return <div className="flex h-14 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-muted-line/60 bg-surface-sunken shadow-soft">{src && !failed ? <img src={src} alt="" loading="lazy" referrerPolicy="no-referrer" className="h-full w-full object-cover" onError={() => setFailed(true)} /> : <BookOpen size={18} className="text-muted" aria-hidden="true" />}</div>;
}
function Loading() {
  return <div role="status" aria-label="Loading dashboard" className="space-y-5"><span className="sr-only">Loading dashboard data</span><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{cards.map(card => <Card key={card.key} className="h-44 animate-pulse border-muted-line/60"><div className="flex justify-between"><span className="h-3 w-2/3 rounded bg-muted-line/70" /><span className="h-9 w-9 rounded-xl bg-muted-line/50" /></div><div className="mt-3 h-9 w-1/3 rounded bg-muted-line/70" /><div className="mt-4 h-2 w-3/4 rounded bg-muted-line/40" /></Card>)}</div><div className="grid gap-5 xl:grid-cols-2">{[0, 1].map(i => <Card key={i} className="h-80 animate-pulse border-muted-line/60"><div className="h-4 w-1/3 rounded bg-muted-line/60" /><div className="mt-8 h-48 rounded-xl bg-surface/70" /></Card>)}</div></div>;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [months, setMonths] = useState(6);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    api.get<DashboardData>('/admin/dashboard', { params: { months }, signal: controller.signal })
      .then(response => setData(response.data))
      .catch(error => { if (!controller.signal.aborted) setError(parseApiError(error).message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [months, refresh]);

  return <div className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-5 pb-1"><div><p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">Your community at a glance</p><h1 className="text-3xl font-semibold sm:text-4xl">Dashboard overview</h1><p className="mt-2 text-sm leading-relaxed text-muted">Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}. Here is what is happening on Readora.</p></div>
      <div className="flex max-w-full flex-wrap items-center gap-2"><label className="flex items-center gap-2 rounded-xl border border-muted-line/70 bg-surface-raised px-3 text-xs"><CalendarDays size={15} className="text-muted" aria-hidden="true" /><span className="sr-only">Chart date range</span><select value={months} onChange={event => setMonths(Number(event.target.value))} className="h-10 min-w-0 rounded bg-surface-raised pr-1 text-ink">{[3, 6, 12].map(value => <option key={value} value={value}>Last {value} months</option>)}</select></label><Button size="sm" variant="secondary" className="!h-10 !rounded-xl" disabled={loading} onClick={() => setRefresh(value => value + 1)} leftIcon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} aria-hidden="true" />}>Refresh</Button></div>
    </div>
    {error ? <Card role="alert" className="border-danger/30"><div className="flex gap-3"><CircleAlert size={22} className="shrink-0 text-danger" aria-hidden="true" /><div><h2 className="font-sans text-base font-semibold">We could not load your overview</h2><p className="mt-2 text-sm text-muted">{error}</p><Button className="mt-4" size="sm" onClick={() => setRefresh(value => value + 1)}>Try again</Button></div></div></Card> : loading ? <Loading /> : data && <>
      <section aria-label="Platform statistics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{cards.map(({ title, key, icon: Icon, note }) => <Card key={key} className="group flex min-h-44 flex-col justify-between border-muted-line/60 !p-5 transition-colors hover:border-accent/30 sm:!p-6"><div className="flex items-start justify-between gap-3"><div><h2 className="font-sans text-xs font-medium text-muted">{title}</h2><p className={`mt-3 font-semibold leading-none tracking-tight tabular-nums ${data.stats[key] === null ? 'text-2xl text-ink/80' : 'text-4xl'}`}>{data.stats[key] === null ? 'Unavailable' : number(data.stats[key]!)}</p></div><span className="rounded-xl border border-accent/10 bg-accent/10 p-2.5 text-accent transition-colors group-hover:bg-accent/15"><Icon size={20} strokeWidth={1.7} aria-hidden="true" /></span></div><p className="mt-4 text-[11px] leading-relaxed text-muted">{note}</p></Card>)}</section>
      <section aria-label="Analytics" className="grid gap-5 xl:grid-cols-2"><AdminChart key={`growth-${months}`} title="User growth" description="Monthly registrations of reader accounts." rows={data.growth} /><AdminChart key={`reading-${months}`} title="Reading activity" description="Recorded page-read reward events, not reading sessions or page totals." rows={data.reading} variant="line" /></section>
      <section aria-label="Books and readers" className="grid items-start gap-5 xl:grid-cols-2">
        <Card className="min-w-0 border-muted-line/60 !p-5 sm:!p-6"><PanelHeading title="Most popular books" description="Ranked by unique recorded readers, all time." icon={BookOpen} />{!data.popular.length ? <Empty icon={BookOpen} title="The next favorite is waiting" description="Books will appear here when readers begin recording their progress." /> : <ol className="mt-4 divide-y divide-muted-line/50">{data.popular.map((book, i) => <li key={book._id} className="flex items-center gap-3 py-3.5"><span className={`w-5 shrink-0 text-center text-xs font-semibold tabular-nums ${i === 0 ? 'text-accent' : 'text-muted'}`}>{String(i + 1).padStart(2, '0')}</span><BookThumbnail key={`${book._id}-${book.coverUrl}`} src={book.coverUrl} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold" title={book.title}>{book.title}</p><p className="mt-1 truncate text-xs text-muted">{book.author || 'Unknown author'}</p></div><div className="shrink-0 text-right"><p className="text-sm font-semibold tabular-nums">{number(book.count)}</p><p className="mt-1 text-[10px] text-muted">{book.count === 1 ? 'reader' : 'readers'}</p></div></li>)}</ol>}</Card>
        <Card className="min-w-0 border-muted-line/60 !p-5 sm:!p-6"><PanelHeading title="Recently registered users" description="The newest members of your reading community." icon={Users} />{!data.recentUsers.length ? <Empty icon={UserPlus} title="Ready to welcome your readers" description="Newly registered reader accounts will appear here." /> : <table className="mt-5 w-full table-fixed text-left"><caption className="sr-only">Latest registered reader accounts</caption><thead><tr className="border-b border-muted-line/60 text-[10px] uppercase tracking-wider text-muted"><th scope="col" className="pb-3 font-medium">Reader</th><th scope="col" className="w-24 pb-3 text-right font-medium sm:w-28">Registered</th></tr></thead><tbody className="divide-y divide-muted-line/50">{data.recentUsers.map(reader => <tr key={reader._id}><td className="py-3.5 pr-3"><div className="flex min-w-0 items-center gap-2.5"><Avatar name={reader.name} className="hidden rounded-full bg-accent/10 text-xs text-accent min-[380px]:flex" /><div className="min-w-0"><p className="truncate text-sm font-medium" title={reader.name}>{reader.name}</p><p className="mt-1 break-all text-[11px] text-muted">{reader.email}</p></div></div></td><td className="py-3.5 text-right align-middle text-[11px] leading-relaxed text-muted"><time dateTime={reader.createdAt}>{date(reader.createdAt)}</time></td></tr>)}</tbody></table>}</Card>
      </section>
      <section aria-label="Community activity" className="grid items-start gap-5 xl:grid-cols-2">
        <Card className="min-w-0 border-muted-line/60 !p-5 sm:!p-6"><PanelHeading title="Recent platform activity" description="Latest tracked registrations and task completions." icon={Activity} />{!data.activity.length ? <Empty icon={Activity} title="A quiet moment on Readora" description="Registrations and completed reading tasks will appear in this timeline." /> : <ol className="mt-5">{data.activity.map((item, i) => {
          const registration = item.id.startsWith('user-');
          const Icon = registration ? UserPlus : CheckCheck;
          return <li key={item.id} className="relative flex gap-3 pb-5 last:pb-0">{i < data.activity.length - 1 && <span aria-hidden="true" className="absolute bottom-0 left-4 top-8 w-px bg-muted-line/60" />}<span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-muted-line/60 bg-surface text-accent"><Icon size={14} aria-hidden="true" /></span><div className="min-w-0 flex-1 pt-0.5"><p className="break-words text-sm leading-relaxed">{item.text}</p><time dateTime={item.date} title={new Date(item.date).toLocaleString()} className="mt-1 block text-[10px] text-muted">{date(item.date)} at {new Date(item.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</time></div></li>;
        })}</ol>}</Card>
        <Card className="min-w-0 border-muted-line/60 !p-5 sm:!p-6"><PanelHeading title="Most active readers" description="Ranked by all-time recorded book completions." icon={Trophy} />{!data.activeReaders.length ? <Empty icon={Trophy} title="Great reads deserve recognition" description="Your top readers will appear here after their first recorded book completions." /> : <ol className="mt-4 divide-y divide-muted-line/50">{data.activeReaders.map((reader, i) => <li key={reader._id} className="flex items-center gap-3 py-4"><span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-semibold ${i === 0 ? 'bg-accent/15 text-accent' : 'bg-surface text-muted'}`}>{i + 1}</span><Avatar name={reader.name} className="h-9 w-9 rounded-full bg-accent/10 text-xs text-accent" /><span className="min-w-0 flex-1 truncate text-sm font-medium" title={reader.name}>{reader.name}</span><div className="shrink-0 text-right"><p className="text-sm font-semibold tabular-nums">{number(reader.count)}</p><p className="mt-1 text-[10px] text-muted">{reader.count === 1 ? 'book completed' : 'books completed'}</p></div></li>)}</ol>}</Card>
      </section>
      <p className="flex flex-wrap items-center justify-between gap-2 text-[10px] leading-relaxed text-muted"><span>Based on recorded platform activity. All-time totals unless indicated.</span><span>Last updated {new Date(data.generatedAt).toLocaleString()}</span></p>
    </>}
    <section aria-label="Quick actions" className="rounded-2xl border border-muted-line/60 bg-surface-raised p-5 sm:p-6"><div className="mb-4 flex flex-wrap items-baseline justify-between gap-2"><h2 className="text-lg font-semibold">Quick actions</h2><p className="text-[11px] text-muted">Management tools are planned</p></div><div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">{actions.map(({ label, module, icon: Icon }) => <Link key={label} to={`/admin/${modulePath(module)}`} className="group flex min-w-0 items-center gap-3 rounded-xl border border-muted-line/50 bg-surface/40 px-4 py-3.5 transition-colors hover:border-accent/30 hover:bg-accent/5"><Icon size={18} className="shrink-0 text-accent" strokeWidth={1.7} aria-hidden="true" /><div className="min-w-0 flex-1"><p className="text-xs font-medium">{label}</p><p className="mt-1 text-[10px] text-muted">Preview planned module</p></div><ArrowRight size={15} className="shrink-0 text-muted transition-colors group-hover:text-accent" aria-hidden="true" /></Link>)}</div></section>
  </div>;
}
