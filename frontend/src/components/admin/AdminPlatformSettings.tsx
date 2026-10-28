import { useEffect, useId, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { PlatformSettingsSnapshot, PublicPlatformSettings } from '@readora/shared';
import { Loader2 } from 'lucide-react';
import { fetchPlatformSettings, savePlatformSettings } from '../../api/platformSettings.api';
import { usePlatformSettings } from '../../store/platformSettingsStore';
import { parseApiError } from '../../utils/apiError';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { controlClass, LoadingUsers, UserError } from './UserManagement';

export default function AdminPlatformSettings() {
  const [snapshot, setSnapshot] = useState<PlatformSettingsSnapshot | null>(null);
  const [draft, setDraft] = useState<PublicPlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState('');
  const [loadError, setLoadError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const busy = useRef(false);
  const id = useId();
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setLoadError('');
    fetchPlatformSettings(controller.signal).then(value => {
      if (!controller.signal.aborted) { setSnapshot(value); setDraft(value.settings); setError(''); setFields({}); }
    }).catch(error => { if (!controller.signal.aborted) setLoadError(parseApiError(error).message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [refresh]);
  useEffect(() => {
    if (!confirming) return;
    dialog.current?.showModal(); const previous = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { dialog.current?.close(); document.body.style.overflow = previous; };
  }, [confirming]);
  const edit = <K extends keyof PublicPlatformSettings>(key: K, value: PublicPlatformSettings[K]) => {
    setDraft(previous => previous && { ...previous, [key]: value }); setError(''); setFields({}); setSuccess('');
  };
  const prepare = (event: FormEvent) => {
    event.preventDefault();
    if (!draft || busy.current) return;
    if (draft.displayName.trim().length < 2) { setFields({ 'settings.displayName': 'Enter at least 2 characters.' }); return; }
    if (draft.announcementEnabled && !draft.announcementText.trim()) { setFields({ 'settings.announcementText': 'Enter text before enabling the announcement.' }); return; }
    setError(''); setFields({}); setConfirming(true);
  };
  const publish = async () => {
    if (!draft || !snapshot || busy.current) return;
    busy.current = true; setSaving(true); setSuccess('');
    try {
      const saved = await savePlatformSettings({ revision: snapshot.revision, settings: { ...draft, displayName: draft.displayName.trim(), description: draft.description.trim(), supportEmail: draft.supportEmail.trim(), announcementText: draft.announcementText.trim() } });
      setSnapshot(saved); setDraft(saved.settings); usePlatformSettings.getState().apply(saved.settings); setSuccess('Platform settings published. The public website now uses these values.');
    } catch (error) { const parsed = parseApiError(error); setError(parsed.message); setFields(parsed.fields); }
    finally { busy.current = false; setSaving(false); setConfirming(false); }
  };
  if (loading) return <Card><LoadingUsers /></Card>;
  if (loadError) return <UserError message={loadError} retry={() => setRefresh(value => value + 1)} />;
  if (!draft || !snapshot) return null;
  const dirty = JSON.stringify(draft) !== JSON.stringify(snapshot.settings);
  return <Card className="min-w-0"><h2 className="text-xl font-semibold">Platform settings</h2><p className="mt-2 text-xs leading-relaxed text-muted">Public website information. Changes are validated, versioned and recorded in the administrative audit log.</p>
    <form onSubmit={prepare} className="mt-6 min-w-0 space-y-6">
      <fieldset disabled={saving} className="min-w-0 space-y-4"><legend className="mb-4 text-sm font-semibold text-accent">General</legend>
        <Input label="Website display name" required minLength={2} maxLength={60} value={draft.displayName} onChange={event => edit('displayName', event.target.value)} error={fields['settings.displayName']} hint="Displayed in website navigation, the footer and browser title." />
        <label className="block text-sm font-medium" htmlFor={`${id}-description`}>Website description</label><textarea id={`${id}-description`} maxLength={500} value={draft.description} onChange={event => edit('description', event.target.value)} className="min-h-24 w-full rounded-xl border border-muted-line bg-surface-sunken p-3 text-sm" aria-describedby={`${id}-description-hint`} /><p id={`${id}-description-hint`} className="text-xs text-muted">Shown in the footer and browser description metadata. Up to 500 characters.</p>
        <Input label="Public support contact email" type="email" maxLength={254} value={draft.supportEmail} onChange={event => edit('supportEmail', event.target.value)} error={fields['settings.supportEmail']} hint="Optional. Adds a contact email link to the footer; does not change email delivery configuration." />
      </fieldset>
      <fieldset disabled={saving} className="min-w-0 space-y-3 border-t border-muted-line/60 pt-5"><legend className="text-sm font-semibold text-accent">Branding</legend>
        <label className="block text-sm" htmlFor={`${id}-logo`}>Website logo</label><select id={`${id}-logo`} className={controlClass} value={draft.logoStyle} onChange={event => edit('logoStyle', event.target.value as PublicPlatformSettings['logoStyle'])}><option value="book">Readora book mark (default)</option><option value="app-icon">Existing Readora app icon</option></select>
        {draft.logoStyle === 'app-icon' && <img src="/icons/icon-192.png" alt="Readora app icon preview" className="h-12 w-12 rounded-xl" />}
        <p className="text-xs leading-relaxed text-muted">Uses existing bundled assets. The website’s reader theme preference remains under each reader’s control.</p>
      </fieldset>
      <fieldset disabled={saving} className="min-w-0 space-y-4 border-t border-muted-line/60 pt-5"><legend className="text-sm font-semibold text-accent">Public announcement</legend>
        <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" className="h-4 w-4 accent-accent" checked={draft.announcementEnabled} onChange={event => edit('announcementEnabled', event.target.checked)} />Display announcement on reader pages</label>
        <label htmlFor={`${id}-announcement`} className="block text-sm font-medium">Announcement text</label><textarea id={`${id}-announcement`} maxLength={500} required={draft.announcementEnabled} value={draft.announcementText} onChange={event => edit('announcementText', event.target.value)} aria-invalid={Boolean(fields['settings.announcementText'])} aria-describedby={`${id}-announcement-hint`} className="min-h-24 w-full rounded-xl border border-muted-line bg-surface-sunken p-3 text-sm" />
        <p id={`${id}-announcement-hint`} className={`text-xs ${fields['settings.announcementText'] ? 'text-danger' : 'text-muted'}`}>{fields['settings.announcementText'] || 'Plain text, up to 500 characters. Saved text is public even while hidden. This is an announcement only; it does not disable access or put the site into maintenance mode.'}</p>
      </fieldset>
      {error && <div role="alert" className="space-y-2 text-sm text-danger"><p className="break-words">{error}</p><Button variant="secondary" size="sm" onClick={() => { setSuccess(''); setRefresh(value => value + 1); }}>Reload latest settings (discard edits)</Button></div>}
      {success && <p role="status" className="rounded-xl bg-accent/10 p-4 text-sm text-accent">{success}</p>}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-muted-line/60 pt-5"><span className="text-xs text-muted">Revision {snapshot.revision}</span><div className="flex flex-wrap gap-2"><Button variant="secondary" disabled={!dirty || saving} onClick={() => { setDraft(snapshot.settings); setError(''); setFields({}); setSuccess(''); }}>Discard edits</Button><Button type="submit" disabled={!dirty || saving}>Review & publish</Button></div></div>
    </form>
    {confirming && <dialog ref={dialog} aria-labelledby={`${id}-confirm`} aria-describedby={`${id}-confirm-description`} onCancel={event => { event.preventDefault(); if (!busy.current) setConfirming(false); }} className="dark m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-lg overflow-y-auto rounded-2xl border border-muted-line bg-surface-raised p-6 text-ink backdrop:bg-black/65">
      <h3 id={`${id}-confirm`} className="text-xl font-semibold">Publish platform settings?</h3><p id={`${id}-confirm-description`} className="mt-3 text-sm text-muted">These public values will be visible on the website. This change is audited.</p>
      <dl className="mt-5 space-y-3 text-sm">{[['Website name', draft.displayName], ['Description', draft.description || '(empty)'], ['Support email', draft.supportEmail || '(not displayed)'], ['Logo', draft.logoStyle === 'book' ? 'Readora book mark' : 'Readora app icon'], ['Announcement visibility', draft.announcementEnabled ? 'Visible' : 'Hidden'], ['Announcement text', draft.announcementText || '(empty)']].map(([label, value]) => <div key={label}><dt className="text-xs text-muted">{label}</dt><dd className="mt-1 whitespace-pre-wrap break-words">{value}</dd></div>)}</dl>
      <div className="mt-6 flex flex-wrap justify-end gap-2"><Button variant="secondary" disabled={saving} onClick={() => setConfirming(false)}>Cancel</Button><Button disabled={saving} leftIcon={saving ? <Loader2 size={16} className="animate-spin" /> : undefined} onClick={() => void publish()}>{saving ? 'Publishing…' : 'Publish settings'}</Button></div>
    </dialog>}
  </Card>;
}
