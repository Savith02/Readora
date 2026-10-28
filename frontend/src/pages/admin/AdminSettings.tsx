import AdminSecurity from '../../components/admin/AdminSecurity';
import { useEffect, useId, useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import { CalendarDays, Check, ChevronRight, CircleAlert, Info, Loader2, Mail, RefreshCw, ShieldCheck, UserRound } from 'lucide-react';
import { fetchAdminProfile } from '../../api/adminProfile.api';
import type { AdminProfile } from '../../api/adminProfile.api';
import Avatar from '../../components/layout/Avatar';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import { useAuth } from '../../hooks/useAuth';
import { parseApiError } from '../../utils/apiError';

const sections = [
  { key: 'profile', title: 'Admin profile', description: 'Your name and identity', icon: UserRound },
  { key: 'account', title: 'Account details', description: 'Email and membership', icon: Mail },
  { key: 'security', title: 'Access & security', description: 'Passwords and sessions', icon: ShieldCheck },
] as const;
type Section = typeof sections[number]['key'];
const joined = (value: string | null) => value ? new Date(value).toLocaleDateString(undefined, { dateStyle: 'long' }) : 'Not recorded';

export default function AdminSettings() {
  const { user, updateAdminName } = useAuth();
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [name, setName] = useState('');
  const [section, setSection] = useState<Section>('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [nameError, setNameError] = useState('');
  const [success, setSuccess] = useState('');
  const [refresh, setRefresh] = useState(0);
  const nameRef = useRef<HTMLInputElement>(null);
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const tabId = useId();
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setLoadError('');
    fetchAdminProfile(controller.signal).then(result => { setProfile(result); setName(result.name); }).catch(error => { if (!controller.signal.aborted) setLoadError(parseApiError(error).message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [refresh]);
  const onTabKey = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = index;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % sections.length;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index + sections.length - 1) % sections.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = sections.length - 1;
    else return;
    event.preventDefault(); setSection(sections[next].key); tabsRef.current[next]?.focus();
  };
  const save = async (event: FormEvent) => {
    event.preventDefault(); setError(''); setNameError(''); setSuccess('');
    const trimmed = name.trim();
    if (trimmed.length < 2 || trimmed.length > 50) { setNameError('Enter a display name between 2 and 50 characters.'); nameRef.current?.focus(); return; }
    setSaving(true);
    try {
      const updated = await updateAdminName(trimmed);
      setProfile(updated); setName(updated.name); setSuccess('Your display name has been updated.');
    } catch (error) {
      const parsed = parseApiError(error); setError(parsed.message); setNameError(parsed.fields.name ?? '');
      if (parsed.fields.name) nameRef.current?.focus();
    } finally { setSaving(false); }
  };
  const dirty = profile !== null && name.trim() !== profile.name;

  return <div className="space-y-6">
    <div><p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">Your workspace</p><h1 className="text-3xl font-semibold sm:text-4xl">Settings & profile</h1><p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">Manage your administrator identity and review your account details.</p></div>
    <div className="grid min-w-0 items-start gap-5 xl:grid-cols-[220px_minmax(0,1fr)]">
      <nav aria-label="Settings sections" className="min-w-0"><div role="tablist" aria-label="Administrator settings" className="grid gap-2 sm:grid-cols-3 xl:grid-cols-1">{sections.map(({ key, title, description, icon: Icon }, index) => <button key={key} ref={element => { tabsRef.current[index] = element; }} type="button" role="tab" id={`${tabId}-${key}`} aria-selected={section === key} aria-controls={`${tabId}-panel-${key}`} tabIndex={section === key ? 0 : -1} onKeyDown={event => onTabKey(event, index)} onClick={() => setSection(key)} className={`flex min-h-16 min-w-0 items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${section === key ? 'border-accent/25 bg-accent/10 text-accent' : 'border-muted-line/50 bg-surface-raised text-muted hover:border-muted-line hover:text-ink'}`}><Icon size={18} strokeWidth={1.8} className="shrink-0" aria-hidden="true" /><span className="min-w-0 flex-1"><span className="block text-xs font-semibold">{title}</span><span className="mt-1 block text-[10px] font-normal text-muted">{description}</span></span><ChevronRight size={14} className="hidden shrink-0 xl:block" aria-hidden="true" /></button>)}</div></nav>
      <div className="min-w-0 space-y-5">
        {loading ? <Card role="status" aria-label="Loading administrator profile" className="animate-pulse"><span className="sr-only">Loading administrator profile</span><div className="flex items-center gap-4"><div className="h-16 w-16 rounded-2xl bg-muted-line/60" /><div className="min-w-0 flex-1 space-y-3"><div className="h-4 w-36 max-w-full rounded bg-muted-line/60" /><div className="h-3 w-48 max-w-full rounded bg-muted-line/40" /></div></div><div className="mt-8 h-44 rounded-xl bg-surface-sunken" /></Card> : loadError ? <Card role="alert" className="border-danger/30"><CircleAlert size={23} className="mb-3 text-danger" /><h2 className="text-xl">Profile unavailable</h2><p className="mt-2 break-words text-sm text-muted">{loadError}</p><Button size="sm" className="mt-4" leftIcon={<RefreshCw size={14} />} onClick={() => setRefresh(value => value + 1)}>Try again</Button></Card> : profile && <>
          <Card className="min-w-0 border-muted-line/60"><div className="flex flex-wrap items-center gap-4"><Avatar name={user?.name ?? profile.name} className="h-16 w-16 rounded-2xl bg-accent/15 text-2xl text-accent" /><div className="min-w-0 flex-1 basis-40"><h2 className="break-words text-2xl font-semibold">{profile.name}</h2><p className="mt-1 break-all text-xs text-muted">{profile.email}</p><div className="mt-3 flex flex-wrap items-center gap-2"><span className="inline-flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent/10 px-2.5 py-1 text-[10px] font-medium text-accent"><ShieldCheck size={12} aria-hidden="true" />Administrator</span><span className="inline-flex items-center gap-1.5 rounded-full border border-muted-line/70 px-2.5 py-1 text-[10px] text-muted"><span className="h-1.5 w-1.5 rounded-full bg-accent" />{profile.status === 'suspended' ? 'Suspended' : 'Active account'}</span></div></div></div></Card>
          {success && <p role="status" className="flex items-start gap-2 rounded-xl border border-accent/20 bg-accent/10 p-4 text-sm text-accent"><Check size={18} className="shrink-0" aria-hidden="true" />{success}</p>}
          <section role="tabpanel" id={`${tabId}-panel-profile`} aria-labelledby={`${tabId}-profile`} hidden={section !== 'profile'} tabIndex={0} className="min-w-0 rounded-2xl">
            <Card className="min-w-0 border-muted-line/60"><div className="mb-6 border-b border-muted-line/60 pb-5"><h2 className="text-xl font-semibold">Personal information</h2><p className="mt-2 text-xs leading-relaxed text-muted">Your display name appears in the admin sidebar and account menus.</p></div>
              <form onSubmit={save} noValidate className="space-y-5"><Input ref={nameRef} label="Display name" autoComplete="name" value={name} minLength={2} maxLength={50} required disabled={saving} onChange={event => { setName(event.target.value); setNameError(''); setError(''); setSuccess(''); }} error={nameError} hint="Use between 2 and 50 characters." /><Input label="Email address" type="email" value={profile.email} readOnly hint="Email changes require a separate verification process." />
                {error && <p role="alert" className="break-words text-sm text-danger">{error}</p>}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-muted-line/60 pt-5"><p className="max-w-xs text-[11px] leading-relaxed text-muted">Only your display name is updated.</p><div className="flex flex-wrap gap-2"><Button variant="secondary" disabled={saving || !dirty} onClick={() => { setName(profile.name); setNameError(''); setError(''); setSuccess(''); }}>Reset</Button><Button type="submit" disabled={saving || !dirty} leftIcon={saving ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Check size={16} aria-hidden="true" />}>{saving ? 'Saving...' : 'Save changes'}</Button></div></div>
              </form>
            </Card>
          </section>
          <section role="tabpanel" id={`${tabId}-panel-account`} aria-labelledby={`${tabId}-account`} hidden={section !== 'account'} tabIndex={0} className="min-w-0 rounded-2xl"><Card className="min-w-0 border-muted-line/60"><h2 className="text-xl font-semibold">Account details</h2><p className="mt-2 text-xs leading-relaxed text-muted">The details associated with your Readora account.</p><dl className="mt-6 divide-y divide-muted-line/60"><div className="py-4"><dt className="flex items-center gap-2 text-xs text-muted"><Mail size={15} aria-hidden="true" />Email address</dt><dd className="mt-2 break-all text-sm">{profile.email}</dd></div><div className="py-4"><dt className="flex items-center gap-2 text-xs text-muted"><CalendarDays size={15} aria-hidden="true" />Account created</dt><dd className="mt-2 text-sm">{joined(profile.createdAt)}</dd></div><div className="py-4"><dt className="text-xs text-muted">Account role</dt><dd className="mt-2 text-sm">Administrator</dd></div><div className="py-4"><dt className="text-xs text-muted">Account status</dt><dd className="mt-2 text-sm capitalize">{profile.status}</dd></div></dl><p className="mt-4 flex items-start gap-2 rounded-xl bg-surface-sunken p-4 text-xs leading-relaxed text-muted"><Info size={16} className="shrink-0" aria-hidden="true" />Email, role and status are read-only in profile settings.</p></Card></section>
          <section role="tabpanel" id={`${tabId}-panel-security`} aria-labelledby={`${tabId}-security`} hidden={section !== 'security'} tabIndex={0} className="min-w-0 rounded-2xl"><AdminSecurity /></section>
        </>}
      </div>
    </div>
  </div>;
}
