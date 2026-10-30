import { useEffect, useState } from 'react';
import { ArrowUpRight, CalendarDays, ChevronRight, LockKeyhole, Mail, PencilLine, ShieldCheck, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchAdminProfile } from '../../api/adminProfile.api';
import { fetchAdminSecurity } from '../../api/adminSecurity.api';
import type { AdminProfile as Profile } from '../../api/adminProfile.api';
import { useAuth } from '../../hooks/useAuth';
import { parseApiError } from '../../utils/apiError';
import Avatar from '../../components/layout/Avatar';
import Card from '../../components/ui/Card';
import { StatusBadge, UserError } from '../../components/admin/UserManagement';

const dateLabel = (value?: string | null) => value ? new Date(value).toLocaleDateString(undefined, { dateStyle: 'long' }) : 'Not recorded';
const quickLinkClass = 'group flex min-h-16 items-center gap-3 rounded-xl border border-muted-line/60 bg-surface-sunken/50 p-4 transition-colors hover:border-accent/30 hover:bg-accent/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

export default function AdminProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [security, setSecurity] = useState<{ passwordChangedAt: string | null } | null>(null);
  const [securityLoading, setSecurityLoading] = useState(true);
  const [securityError, setSecurityError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    setProfile(null); setLoading(true); setError('');
    setSecurity(null); setSecurityLoading(true); setSecurityError('');
    fetchAdminSecurity(controller.signal).then(value => { if (!controller.signal.aborted) setSecurity(value); })
      .catch(error => { if (!controller.signal.aborted) setSecurityError(parseApiError(error).message); })
      .finally(() => { if (!controller.signal.aborted) setSecurityLoading(false); });
    fetchAdminProfile(controller.signal).then(value => {
      if (controller.signal.aborted) return;
      if (value.id !== user?.id) { setError('Your account changed. Reload your profile.'); return; }
      setProfile(value);
    }).catch(error => { if (!controller.signal.aborted) setError(parseApiError(error).message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [user?.id, refresh]);
  const ownProfile = profile?.id === user?.id ? profile : null;
  return <div className="min-w-0 space-y-6">
    <header className="space-y-4"><nav aria-label="Breadcrumb"><ol className="flex flex-wrap items-center gap-2 text-xs text-muted"><li><Link to="/admin/dashboard" className="rounded transition-colors hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">Administration</Link></li><li aria-hidden="true"><ChevronRight size={13} /></li><li aria-current="page" className="text-accent">My Profile</li></ol></nav><div><h1 className="text-3xl font-semibold sm:text-4xl">My Admin Profile</h1><p className="mt-2 text-sm leading-relaxed text-muted">Manage your personal administrator information</p></div></header>
    {loading ? <Card role="status" aria-label="Loading administrator profile" className="animate-pulse"><span className="sr-only">Loading administrator profile</span><div className="flex items-center gap-4"><div className="h-20 w-20 shrink-0 rounded-2xl bg-accent/10" /><div className="flex-1 space-y-3"><div className="h-5 w-40 max-w-full rounded bg-muted-line/60" /><div className="h-3 w-52 max-w-full rounded bg-muted-line/40" /></div></div><div className="mt-6 h-32 rounded-xl bg-surface-sunken" /></Card> : error ? <UserError message={error} retry={() => setRefresh(value => value + 1)} /> : ownProfile && <>
      <Card className="min-w-0 border-accent/15 bg-gradient-to-br from-accent/5 to-transparent sm:p-8">
        <div className="flex min-w-0 flex-wrap items-center gap-5"><Avatar name={ownProfile.name} className="h-20 w-20 rounded-2xl border border-accent/20 bg-accent/10 text-3xl text-accent" /><div className="min-w-0 flex-1 basis-48"><p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">Administrator profile</p><h2 className="break-words text-2xl font-semibold sm:text-3xl">{ownProfile.name}</h2><p className="mt-2 break-all text-sm text-muted">{ownProfile.email}</p><div className="mt-4 flex flex-wrap items-center gap-2"><span className="inline-flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-[11px] font-medium text-accent"><ShieldCheck size={13} aria-hidden="true" />Administrator</span><StatusBadge status={ownProfile.status} /></div></div></div>
      </Card>
      <div className="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <Card className="min-w-0"><div className="flex items-center gap-3 border-b border-muted-line/60 pb-5"><span className="rounded-xl bg-accent/10 p-2.5 text-accent"><UserRound size={19} aria-hidden="true" /></span><div><h2 className="text-xl font-semibold">Personal Information</h2><p className="mt-1 text-xs text-muted">Your identity on Readora</p></div></div>
          <dl className="grid min-w-0 gap-6 pt-6 sm:grid-cols-2">{[
            { label: 'Display name', value: ownProfile.name, icon: UserRound }, { label: 'Email address', value: ownProfile.email, icon: Mail },
            { label: 'Role', value: 'Administrator', icon: ShieldCheck }, { label: 'Registration date', value: dateLabel(ownProfile.createdAt), icon: CalendarDays },
          ].map(({ label, value, icon: Icon }) => <div key={label} className="min-w-0"><dt className="flex items-center gap-2 text-xs text-muted"><Icon size={14} aria-hidden="true" />{label}</dt><dd className="mt-2 break-words text-sm font-medium">{value}</dd></div>)}</dl>
        </Card>
        <div className="min-w-0 space-y-5">
          <Card className="min-w-0"><h2 className="text-xl font-semibold">Account Overview</h2><dl className="mt-5 divide-y divide-muted-line/60"><div className="flex flex-wrap items-center justify-between gap-3 pb-4"><dt className="text-xs text-muted">Account status</dt><dd><StatusBadge status={ownProfile.status} /></dd></div><div className="space-y-2 py-4"><dt className="text-xs text-muted">Account creation date</dt><dd className="text-sm">{dateLabel(ownProfile.createdAt)}</dd></div><div className="space-y-2 pt-4"><dt className="text-xs text-muted">Password last changed</dt><dd className="text-sm">{securityLoading ? <span role="status" className="text-muted">Loading…</span> : securityError ? <span className="text-muted">Unavailable</span> : dateLabel(security?.passwordChangedAt)}</dd></div></dl>{securityError && <div role="alert" className="mt-4 space-y-2 text-xs"><p className="break-words text-danger">{securityError}</p><button type="button" className="min-h-11 rounded-lg px-2 text-accent hover:bg-accent/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent" onClick={() => setRefresh(value => value + 1)}>Retry account information</button></div>}</Card>
          <Card className="min-w-0"><h2 className="text-xl font-semibold">Quick Links</h2><div className="mt-5 space-y-3"><Link to="/admin/settings?section=profile" className={quickLinkClass}><PencilLine size={18} className="shrink-0 text-accent" aria-hidden="true" /><div className="min-w-0 flex-1"><span className="block text-sm font-semibold">Edit Profile</span><span className="mt-1 block text-xs text-muted">Update your display name</span></div><ArrowUpRight size={16} className="shrink-0 text-muted transition-colors group-hover:text-accent" aria-hidden="true" /></Link><Link to="/admin/settings?section=security" className={quickLinkClass}><LockKeyhole size={18} className="shrink-0 text-accent" aria-hidden="true" /><div className="min-w-0 flex-1"><span className="block text-sm font-semibold">Password & Security</span><span className="mt-1 block text-xs text-muted">Manage your password and sessions</span></div><ArrowUpRight size={16} className="shrink-0 text-muted transition-colors group-hover:text-accent" aria-hidden="true" /></Link></div></Card>
        </div>
      </div>
    </>}
  </div>;
}
