import { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { fetchAdminProfile } from '../../api/adminProfile.api';
import type { AdminProfile as Profile } from '../../api/adminProfile.api';
import { useAuth } from '../../hooks/useAuth';
import { parseApiError } from '../../utils/apiError';
import Avatar from '../../components/layout/Avatar';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { LoadingUsers, UserError } from '../../components/admin/UserManagement';

export default function AdminProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setProfile(null); setLoading(true); setError('');
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
    <div><p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">Your account</p><h1 className="text-3xl font-semibold sm:text-4xl">My profile</h1><p className="mt-2 text-sm text-muted">Your administrator identity and account information.</p></div>
    {loading ? <Card><LoadingUsers /></Card> : error ? <UserError message={error} retry={() => setRefresh(value => value + 1)} /> : ownProfile && <Card className="min-w-0 space-y-6">
      <div className="flex min-w-0 flex-wrap items-center gap-4"><Avatar name={ownProfile.name} className="h-16 w-16 rounded-2xl bg-accent/15 text-2xl text-accent" /><div className="min-w-0 flex-1"><h2 className="break-words text-2xl font-semibold">{ownProfile.name}</h2><span className="mt-2 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-xs text-accent"><ShieldCheck size={14} aria-hidden="true" />Administrator</span></div></div>
      <dl className="grid min-w-0 gap-5 border-t border-muted-line/60 pt-5 sm:grid-cols-2">{[
        ['Email address', ownProfile.email], ['Role', 'Administrator'],
        ['Account status', ownProfile.status === 'active' ? 'Active' : 'Suspended'],
        ['Account created', ownProfile.createdAt ? new Date(ownProfile.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' }) : 'Not recorded'],
      ].map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-xs text-muted">{label}</dt><dd className="mt-2 break-words text-sm">{value}</dd></div>)}</dl>
      <div className="border-t border-muted-line/60 pt-5"><Button to="/admin/settings" variant="secondary">Manage profile & settings</Button></div>
    </Card>}
  </div>;
}
