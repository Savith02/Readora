import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, ShieldCheck } from 'lucide-react';
import { fetchUsers } from '../../api/adminUsers.api';
import type { UsersPage } from '../../api/adminUsers.api';
import { useAuth } from '../../hooks/useAuth';
import { parseApiError } from '../../utils/apiError';
import Avatar from '../layout/Avatar';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { controlClass, formatDate, LoadingUsers, Pagination, StatusBadge, UserActionDialog, UserError } from './UserManagement';
import type { UserAction } from './UserManagement';

export default function AdministratorAccess() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [data, setData] = useState<UsersPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [action, setAction] = useState<UserAction | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    const timer = setTimeout(() => {
      const params = new URLSearchParams({ role: 'admin', page: String(page), pageSize: String(pageSize), sort: 'newest' });
      if (search.trim()) params.set('search', search.trim());
      if (status) params.set('status', status);
      fetchUsers(params, controller.signal).then(result => {
        if (controller.signal.aborted) return;
        if (page > Math.max(1, result.totalPages)) { setPage(Math.max(1, result.totalPages)); return; }
        setData(result);
      }).catch(error => { if (!controller.signal.aborted) setError(parseApiError(error).message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [search, status, page, pageSize, refresh]);
  return <div className="min-w-0 space-y-5">
    <Card className="min-w-0"><div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-xl font-semibold">Administrator access</h2><p className="mt-2 max-w-2xl text-xs leading-relaxed text-muted">Administrators can view platform analytics, manage reader access and roles, view audit history, configure public platform settings, and manage their own profile and security settings.</p></div><ShieldCheck className="text-accent" aria-hidden="true" /></div>
      <div className="mt-4 space-y-2 rounded-xl border border-accent/20 bg-accent/5 p-4 text-xs leading-relaxed text-muted"><p>All active administrators have the same permissions. The current backend allows any active administrator to grant or revoke administrator access after confirming their password and providing a reason. There is no separate approval role.</p><p>You cannot change your own role. The last active administrator is protected. Administrator accounts must be demoted by another administrator before they can be suspended. Role changes end the target account’s existing sessions and are audited.</p></div>
      <Link to="/admin/users?role=user" className="mt-4 inline-flex min-h-11 items-center rounded-xl border border-accent/30 px-4 text-xs font-semibold text-accent transition hover:bg-accent/10">Grant access through User Management</Link>
    </Card>
    {success && <p role="status" className="rounded-xl border border-accent/20 bg-accent/10 p-4 text-sm text-accent">{success}</p>}
    <Card className="min-w-0 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-lg font-semibold">Administrator directory</h3><Button variant="secondary" size="sm" disabled={loading} leftIcon={<RefreshCw size={14} />} onClick={() => setRefresh(value => value + 1)}>Refresh</Button></div>
      <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_150px_110px]">
        <label className="min-w-0 text-xs text-muted">Search name or email<input type="search" maxLength={100} value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} className={`${controlClass} mt-2`} placeholder="Find an administrator" /></label>
        <label className="text-xs text-muted">Account status<select value={status} onChange={event => { setStatus(event.target.value); setPage(1); }} className={`${controlClass} mt-2`}><option value="">All statuses</option><option value="active">Active</option><option value="suspended">Suspended</option></select></label>
        <label className="text-xs text-muted">Per page<select value={pageSize} onChange={event => { setPageSize(Number(event.target.value)); setPage(1); }} className={`${controlClass} mt-2`}>{[10, 25, 50].map(size => <option key={size}>{size}</option>)}</select></label>
      </div>
      {loading ? <LoadingUsers /> : error ? <UserError message={error} retry={() => setRefresh(value => value + 1)} /> : data && <>
        {data.users.length === 0 ? <p className="rounded-xl bg-surface-sunken p-8 text-center text-sm text-muted">No administrators match these filters.</p> : <div className="space-y-3">{data.users.map(admin => <article key={admin._id} className="grid min-w-0 items-center gap-4 rounded-xl border border-muted-line/60 p-4 lg:grid-cols-[minmax(0,1fr)_minmax(120px,auto)_auto]">
          <div className="flex min-w-0 items-center gap-3"><Avatar name={admin.name} className="h-10 w-10 shrink-0 bg-accent/10 text-accent" /><div className="min-w-0"><Link className="break-words text-sm font-semibold hover:text-accent" to={`/admin/users/${admin._id}`}>{admin.name}{admin._id === user?.id ? ' (you)' : ''}</Link><p className="mt-1 break-all text-xs text-muted">{admin.email}</p><span className="mt-2 inline-flex rounded-full bg-accent/10 px-2 py-1 text-[10px] text-accent">Administrator</span></div></div>
          <div className="space-y-2"><StatusBadge status={admin.status} /><p className="text-[11px] text-muted">Registered {formatDate(admin.createdAt)}</p></div>
          <Button size="sm" variant="secondary" disabled={admin._id === user?.id || admin.status === 'suspended'} onClick={() => { setSuccess(''); setAction({ user: admin, kind: 'role' }); }} title={admin._id === user?.id ? 'You cannot change your own role' : admin.status === 'suspended' ? 'Reactivate before changing role' : undefined}>Change to reader</Button>
        </article>)}</div>}
        <Pagination page={data.page} pages={data.totalPages} total={data.total} onPage={setPage} />
      </>}
    </Card>
    {action && <UserActionDialog action={action} onClose={() => setAction(null)} onSaved={message => { setAction(null); setSuccess(message); setRefresh(value => value + 1); }} />}
  </div>;
}
