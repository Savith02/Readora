import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { auditActions, fetchAdminAudit } from '../../api/adminAudit.api';
import type { GlobalAuditPage } from '../../api/adminAudit.api';
import type { GlobalAuditEntry } from '../../api/adminAudit.api';
import { parseApiError } from '../../utils/apiError';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { controlClass, LoadingUsers, Pagination, UserError } from './UserManagement';

const targetName = (log: GlobalAuditEntry) => log.action === 'platform_settings_update' ? 'Platform settings' : log.targetUserId?.name ?? 'Account unavailable';

export default function AdminAuditLogs() {
  const [action, setAction] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [data, setData] = useState<GlobalAuditPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const invalidDates = Boolean(from && to && from > to);
  useEffect(() => {
    const controller = new AbortController();
    if (invalidDates) { setLoading(false); return; }
    setLoading(true); setError('');
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (action) params.set('action', action);
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    fetchAdminAudit(params, controller.signal).then(result => {
      if (controller.signal.aborted) return;
      if (page > Math.max(1, result.totalPages)) { setPage(Math.max(1, result.totalPages)); return; }
      setData(result);
    }).catch(error => { if (!controller.signal.aborted) setError(parseApiError(error).message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [action, from, to, page, pageSize, refresh, invalidDates]);
  return <Card className="min-w-0 space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-semibold">Administrative audit logs</h2><p className="mt-2 text-xs leading-relaxed text-muted">Read-only history of recorded access and security changes. Names reflect current account records. Date filters use UTC.</p></div><Button size="sm" variant="secondary" disabled={loading || invalidDates} leftIcon={<RefreshCw size={14} />} onClick={() => setRefresh(value => value + 1)}>Refresh</Button></div>
    <div className="grid min-w-0 gap-3 sm:grid-cols-2">
      <label className="min-w-0 text-xs text-muted">Action<select value={action} onChange={event => { setAction(event.target.value); setPage(1); }} className={`${controlClass} mt-2`}><option value="">All actions</option>{Object.entries(auditActions).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <label className="text-xs text-muted">Per page<select value={pageSize} onChange={event => { setPageSize(Number(event.target.value)); setPage(1); }} className={`${controlClass} mt-2`}>{[10, 25, 50].map(size => <option key={size}>{size}</option>)}</select></label>
      <label className="min-w-0 text-xs text-muted">From (UTC)<input type="date" value={from} max={to || undefined} onChange={event => { setFrom(event.target.value); setPage(1); }} className={`${controlClass} mt-2`} /></label>
      <label className="min-w-0 text-xs text-muted">Through (UTC)<input type="date" value={to} min={from || undefined} onChange={event => { setTo(event.target.value); setPage(1); }} className={`${controlClass} mt-2`} /></label>
    </div>
    {invalidDates ? <p role="alert" className="text-sm text-danger">The start date must be on or before the end date.</p> : loading ? <LoadingUsers /> : error ? <UserError message={error} retry={() => setRefresh(value => value + 1)} /> : data && <>
      {data.logs.length === 0 ? <p className="rounded-xl bg-surface-sunken p-8 text-center text-sm text-muted">No recorded actions match these filters.</p> : <>
        <div className="hidden lg:block"><table className="w-full table-fixed text-left text-xs"><caption className="sr-only">Administrative actions, newest first</caption><thead className="text-muted"><tr>{['Action / time', 'Administrator / target', 'Reason', 'Previous / new'].map(label => <th scope="col" key={label} className="border-b border-muted-line px-2 py-3 font-medium">{label}</th>)}</tr></thead><tbody>{data.logs.map(log => <tr key={log._id} className="align-top transition hover:bg-surface-sunken/50"><td className="break-words border-b border-muted-line/50 px-2 py-4"><span className="text-accent">{auditActions[log.action as keyof typeof auditActions] ?? log.action}</span><time dateTime={log.createdAt} className="mt-2 block text-[11px] text-muted">{new Date(log.createdAt).toLocaleString()}</time></td><td className="break-words border-b border-muted-line/50 px-2 py-4"><span className="block">{log.administratorId?.name ?? 'Account unavailable'}</span><span className="mt-2 block text-muted">Target: {targetName(log)}</span></td><td className="whitespace-pre-wrap break-words border-b border-muted-line/50 px-2 py-4 text-muted">{log.reason || 'Not recorded'}</td><td className="break-words border-b border-muted-line/50 px-2 py-4"><span className="block text-muted">Previous: {log.previous || 'Not recorded'}</span><span className="mt-2 block">New: {log.next || 'Not recorded'}</span></td></tr>)}</tbody></table></div>
        <div className="space-y-3 lg:hidden">{data.logs.map(log => <article key={log._id} className="min-w-0 rounded-xl border border-muted-line/60 p-4"><h3 className="break-words text-sm font-semibold text-accent">{auditActions[log.action as keyof typeof auditActions] ?? log.action}</h3><time dateTime={log.createdAt} className="mt-1 block text-[11px] text-muted">{new Date(log.createdAt).toLocaleString()}</time><dl className="mt-4 space-y-3 text-xs">{[['Administrator', log.administratorId?.name], ['Target', targetName(log)], ['Reason', log.reason], ['Previous value', log.previous], ['New value', log.next]].map(([label, value]) => <div key={label}><dt className="text-muted">{label}</dt><dd className="mt-1 whitespace-pre-wrap break-words">{value || 'Not recorded'}</dd></div>)}</dl></article>)}</div>
      </>}
      <Pagination page={data.page} pages={data.totalPages} total={data.total} onPage={setPage} />
    </>}
  </Card>;
}
