import { useEffect, useId, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Activity, RefreshCw, Search, ShieldBan, UserPlus, Users } from 'lucide-react';
import { fetchUsers, fetchUserStats } from '../../api/adminUsers.api';
import type { UsersPage, UserStats } from '../../api/adminUsers.api';
import Avatar from '../../components/layout/Avatar';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { controlClass, formatDate, LoadingUsers, Pagination, StatusBadge, UserActionDialog, UserActions, UserError } from '../../components/admin/UserManagement';
import type { UserAction } from '../../components/admin/UserManagement';
import { parseApiError } from '../../utils/apiError';

export default function AdminUsers() {
  const [params, setParams] = useSearchParams();
  const searchId = useId();
  const key = params.toString();
  const [search, setSearch] = useState(params.get('search') ?? '');
  const [data, setData] = useState<UsersPage | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsError, setStatsError] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [action, setAction] = useState<UserAction | null>(null);
  const update = (field: string, value: string) => setParams(previous => {
    const next = new URLSearchParams(previous);
    if (value) next.set(field, value); else next.delete(field);
    if (field !== 'page') next.delete('page');
    return next;
  });
  useEffect(() => { setSearch(new URLSearchParams(key).get('search') ?? ''); }, [key]);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    fetchUsers(new URLSearchParams(key), controller.signal).then(result => setData(result)).catch(error => { if (!controller.signal.aborted) setError(parseApiError(error).message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [key, refresh]);
  useEffect(() => {
    const controller = new AbortController();
    setStatsError('');
    fetchUserStats(controller.signal).then(result => setStats(result)).catch(error => { if (!controller.signal.aborted) setStatsError(parseApiError(error).message); });
    return () => controller.abort();
  }, [refresh]);
  const submitSearch = (event: FormEvent) => { event.preventDefault(); update('search', search.trim()); };
  const overview = [
    { key: 'total', label: 'Total Registered Readers', note: 'All reader accounts, including suspended', icon: Users },
    { key: 'active', label: 'Active Readers', note: 'Unique readers with reading activity in 30 days', icon: Activity },
    { key: 'newThisMonth', label: 'New Users This Month', note: 'Reader registrations this calendar month (UTC)', icon: UserPlus },
    { key: 'suspended', label: 'Suspended Users', note: 'Reader accounts currently suspended', icon: ShieldBan },
  ] as const;
  return <div className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">Community</p><h1 className="text-3xl font-semibold sm:text-4xl">User Management</h1><p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">Know your readers, review their activity, and manage account access.</p></div><Button variant="secondary" size="sm" disabled={loading} onClick={() => setRefresh(value => value + 1)} leftIcon={<RefreshCw size={15} className={loading ? 'animate-spin' : ''} />}>Refresh</Button></div>
    {notice && <p role="status" className="rounded-xl border border-accent/20 bg-accent/10 p-4 text-sm text-accent">{notice}</p>}
    {statsError ? <UserError message={`Statistics unavailable: ${statsError}`} retry={() => setRefresh(value => value + 1)} /> : <section aria-label="Reader overview" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{overview.map(({ key, label, note, icon: Icon }) => <Card key={key} className="flex min-h-40 flex-col justify-between border-muted-line/60 !p-5"><div className="flex items-start justify-between gap-3"><div><h2 className="font-sans text-xs text-muted">{label}</h2>{stats ? <p className="mt-3 text-3xl font-semibold tabular-nums">{stats[key].toLocaleString()}</p> : <div aria-label="Loading statistic" className="mt-3 h-8 w-16 animate-pulse rounded bg-muted-line" />}</div><span className="rounded-xl bg-accent/10 p-2.5 text-accent"><Icon size={19} strokeWidth={1.7} aria-hidden="true" /></span></div><p className="mt-3 text-[10px] leading-relaxed text-muted">{note}</p></Card>)}</section>}
    <Card className="space-y-5 border-muted-line/60 !p-4 sm:!p-6">
      <div><h2 className="text-xl font-semibold">Registered accounts</h2><p className="mt-1 text-xs text-muted">Reader metrics exclude admins. Last activity below means last recorded reading activity.</p></div>
      <form onSubmit={submitSearch} className="grid items-end gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="min-w-0 text-xs text-muted sm:col-span-2"><label htmlFor={searchId} className="mb-2 block">Search by name or email</label><div className="flex gap-2"><input id={searchId} type="search" value={search} maxLength={100} onChange={event => setSearch(event.target.value)} placeholder="Find an account..." className={controlClass} /><Button type="submit" variant="secondary" className="!h-11 !rounded-xl" leftIcon={<Search size={15} />}><span className="sr-only sm:not-sr-only">Search</span></Button></div></div>
        <label className="text-xs text-muted"><span className="mb-2 block">Role</span><select className={controlClass} value={params.get('role') ?? ''} onChange={event => update('role', event.target.value)}><option value="">All roles</option><option value="user">Reader</option><option value="admin">Administrator</option></select></label>
        <label className="text-xs text-muted"><span className="mb-2 block">Account status</span><select className={controlClass} value={params.get('status') ?? ''} onChange={event => update('status', event.target.value)}><option value="">All statuses</option><option value="active">Active</option><option value="suspended">Suspended</option></select></label>
        <label className="text-xs text-muted"><span className="mb-2 block">Registered from (UTC)</span><input type="date" value={params.get('from') ?? ''} onChange={event => update('from', event.target.value)} className={controlClass + ' [color-scheme:dark]'} /></label>
        <label className="text-xs text-muted"><span className="mb-2 block">Registered through (UTC)</span><input type="date" value={params.get('to') ?? ''} onChange={event => update('to', event.target.value)} className={controlClass + ' [color-scheme:dark]'} /></label>
        <label className="text-xs text-muted"><span className="mb-2 block">Sort by</span><select className={controlClass} value={params.get('sort') ?? 'newest'} onChange={event => update('sort', event.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="name_asc">Name A to Z</option><option value="name_desc">Name Z to A</option></select></label>
        <div className="flex items-end gap-2"><label className="min-w-0 flex-1 text-xs text-muted"><span className="mb-2 block">Per page</span><select className={controlClass} value={params.get('pageSize') ?? '10'} onChange={event => update('pageSize', event.target.value)}>{[10, 25, 50].map(size => <option key={size} value={size}>{size}</option>)}</select></label><Button variant="ghost" size="sm" className="!h-11" onClick={() => { setParams({}); setSearch(''); }}>Reset</Button></div>
      </form>
      {error ? <UserError message={error} retry={() => setRefresh(value => value + 1)} /> : loading ? <LoadingUsers /> : data && <>
        {!data.users.length ? <div className="rounded-xl border border-dashed border-muted-line py-12 text-center"><Users size={28} className="mx-auto mb-3 text-muted" /><h3 className="text-lg">No accounts found</h3><p className="mt-2 text-xs text-muted">Try changing your search or filters.</p>{data.page > 1 && <Button size="sm" className="mt-4" onClick={() => update('page', '1')}>Back to first page</Button>}</div> : <>
          <div className="hidden xl:block"><table className="w-full table-fixed text-left text-xs"><caption className="sr-only">Registered accounts and access management</caption><thead className="border-b border-muted-line text-[10px] uppercase tracking-wider text-muted"><tr><th scope="col" className="w-[32%] pb-3 font-medium">Account</th><th scope="col" className="w-[13%] pb-3 font-medium">Role</th><th scope="col" className="w-[13%] pb-3 font-medium">Status</th><th scope="col" className="w-[17%] pb-3 font-medium">Registered</th><th scope="col" className="w-[17%] pb-3 font-medium">Last reading</th><th scope="col" className="pb-3 text-right font-medium">Actions</th></tr></thead><tbody className="divide-y divide-muted-line/50">{data.users.map(user => <tr key={user._id} className="transition hover:bg-surface-sunken/40"><td className="py-4 pr-3"><div className="flex items-center gap-3"><Avatar name={user.name} className="rounded-xl bg-accent/10 text-accent" /><div className="min-w-0"><Link to={`/admin/users/${user._id}`} className="break-words font-medium hover:text-accent hover:underline">{user.name}</Link><p className="mt-1 break-all text-[11px] text-muted">{user.email}</p></div></div></td><td className="pr-2">{user.role === 'admin' ? 'Admin' : 'Reader'}</td><td><StatusBadge status={user.status} /></td><td className="pr-3 text-muted">{formatDate(user.createdAt)}</td><td className="pr-3 text-muted">{formatDate(user.lastReadAt)}</td><td><div className="flex justify-end"><UserActions user={user} onAction={setAction} /></div></td></tr>)}</tbody></table></div>
          <ul className="grid gap-3 md:grid-cols-2 xl:hidden">{data.users.map(user => <li key={user._id} className="min-w-0 rounded-xl border border-muted-line/60 p-4"><div className="flex items-start gap-3"><Avatar name={user.name} className="rounded-xl bg-accent/10 text-accent" /><div className="min-w-0 flex-1"><Link to={`/admin/users/${user._id}`} className="break-words text-sm font-semibold hover:text-accent hover:underline">{user.name}</Link><p className="mt-1 break-all text-xs text-muted">{user.email}</p></div><UserActions user={user} onAction={setAction} /></div><div className="mt-4 flex flex-wrap items-center gap-2"><StatusBadge status={user.status} /><span className="text-xs text-muted">{user.role === 'admin' ? 'Administrator' : 'Reader'}</span></div><dl className="mt-4 grid grid-cols-2 gap-3 text-[11px]"><div><dt className="text-muted">Registered</dt><dd className="mt-1">{formatDate(user.createdAt)}</dd></div><div><dt className="text-muted">Last reading activity</dt><dd className="mt-1">{formatDate(user.lastReadAt)}</dd></div></dl></li>)}</ul>
        </>}
        <Pagination page={data.page} pages={data.totalPages} total={data.total} onPage={page => update('page', String(page))} />
      </>}
    </Card>
    {action && <UserActionDialog action={action} onClose={() => setAction(null)} onSaved={message => { setAction(null); setNotice(message); setRefresh(value => value + 1); }} />}
  </div>;
}
