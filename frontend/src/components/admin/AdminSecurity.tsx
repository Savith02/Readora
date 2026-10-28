import { useEffect, useId, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, LockKeyhole, LogOut, ShieldCheck, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { fetchAdminSecurity } from '../../api/adminSecurity.api';
import PasswordInput from '../auth/PasswordInput';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { parseApiError } from '../../utils/apiError';
import { passwordProblem } from '../../utils/validation';

export default function AdminSecurity() {
  const { changeAdminPassword, signOutAdminSessions } = useAuth();
  const navigate = useNavigate();
  const [info, setInfo] = useState<{ passwordChangedAt: string | null } | null>(null);
  const [infoError, setInfoError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [sessionPassword, setSessionPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [sessionError, setSessionError] = useState('');
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const [confirming, setConfirming] = useState(false);
  const titleId = useId();
  const descriptionId = useId();
  const currentRef = useRef<HTMLInputElement>(null);
  const newRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const controller = new AbortController(); setInfoError('');
    fetchAdminSecurity(controller.signal).then(setInfo).catch(error => { if (!controller.signal.aborted) setInfoError(parseApiError(error).message); });
    return () => controller.abort();
  }, [refresh]);
  useEffect(() => {
    if (!confirming) return;
    dialog.current?.showModal();
    const previous = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { dialog.current?.close(); document.body.style.overflow = previous; };
  }, [confirming]);
  const close = () => { if (!busyRef.current) { setConfirming(false); setSessionPassword(''); setSessionError(''); } };
  const submitPassword = async (event: FormEvent) => {
    event.preventDefault(); if (busyRef.current) return;
    const next: Record<string, string> = {};
    if (!currentPassword) next.currentPassword = 'Enter your current password';
    const problem = passwordProblem(newPassword);
    if (problem) next.newPassword = problem;
    if (new TextEncoder().encode(newPassword).length > 72) next.newPassword = 'Password is too long (72 bytes at most)';
    if (newPassword === currentPassword) next.newPassword = 'Choose a password different from your current password';
    if (!confirmPassword || confirmPassword !== newPassword) next.confirmPassword = 'Passwords do not match';
    setErrors(next); setError('');
    if (Object.keys(next).length) { if (next.currentPassword) currentRef.current?.focus(); else if (next.newPassword) newRef.current?.focus(); else confirmRef.current?.focus(); return; }
    busyRef.current = true; setBusy(true);
    try {
      const result = await changeAdminPassword({ currentPassword, newPassword, confirmPassword });
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      if (result.signedOut) navigate('/login', { replace: true, state: { notice: result.message } });
    } catch (error) { const parsed = parseApiError(error); setError(parsed.message); setErrors(parsed.fields); }
    finally { busyRef.current = false; setBusy(false); }
  };
  const submitSessions = async (event: FormEvent) => {
    event.preventDefault(); if (busyRef.current) return;
    if (!sessionPassword) { setSessionError('Enter your current password to confirm.'); return; }
    busyRef.current = true; setBusy(true); setSessionError('');
    try {
      const result = await signOutAdminSessions(sessionPassword);
      setSessionPassword(''); setConfirming(false);
      if (result.signedOut) navigate('/login', { replace: true, state: { notice: result.message } });
    } catch (error) { setSessionError(parseApiError(error).message); }
    finally { busyRef.current = false; setBusy(false); }
  };
  return <div className="min-w-0 space-y-5">
    <Card className="min-w-0 border-muted-line/60"><h2 className="flex items-center gap-2 text-xl font-semibold"><ShieldCheck size={20} className="shrink-0 text-accent" />Account security</h2><dl className="mt-5 grid gap-4 text-xs sm:grid-cols-2"><div><dt className="text-muted">Authentication</dt><dd className="mt-2">Readora account with JWT sign-in</dd></div><div><dt className="text-muted">Last recorded password change</dt><dd className="mt-2">{infoError ? 'Unavailable' : !info ? 'Loading...' : info.passwordChangedAt ? new Date(info.passwordChangedAt).toLocaleString() : 'Not recorded'}</dd></div></dl>{infoError && <div role="alert" className="mt-4 text-xs text-danger"><p>{infoError}</p><Button size="sm" variant="ghost" className="mt-2" onClick={() => setRefresh(value => value + 1)}>Retry</Button></div>}<p className="mt-5 border-t border-muted-line/60 pt-4 text-xs leading-relaxed text-muted">Password changes and signing out all sessions invalidate existing access tokens, including this session. Individual devices, login locations and active session counts are not tracked.</p></Card>
    <Card className="min-w-0 border-muted-line/60"><h2 className="flex items-center gap-2 text-xl font-semibold"><LockKeyhole size={20} className="shrink-0 text-accent" />Change password</h2><p className="mt-2 text-xs leading-relaxed text-muted">Use at least 8 characters, including a letter and a number. Maximum 72 UTF-8 bytes. You will need to sign in again after saving.</p><form onSubmit={submitPassword} noValidate className="mt-6 space-y-5"><PasswordInput ref={currentRef} label="Current password" autoComplete="current-password" required value={currentPassword} disabled={busy} onChange={event => setCurrentPassword(event.target.value)} error={errors.currentPassword} /><PasswordInput ref={newRef} label="New password" autoComplete="new-password" required value={newPassword} disabled={busy} onChange={event => setNewPassword(event.target.value)} error={errors.newPassword} /><PasswordInput ref={confirmRef} label="Confirm new password" autoComplete="new-password" required value={confirmPassword} disabled={busy} onChange={event => setConfirmPassword(event.target.value)} error={errors.confirmPassword} />{error && <p role="alert" className="break-words text-sm text-danger">{error}</p>}<div className="flex flex-wrap justify-end border-t border-muted-line/60 pt-5"><Button type="submit" disabled={busy} leftIcon={busy ? <Loader2 size={16} className="animate-spin" /> : <LockKeyhole size={16} />}>{busy ? 'Please wait...' : 'Change password'}</Button></div></form></Card>
    <Card className="min-w-0 border-muted-line/60"><h2 className="text-xl font-semibold">Sign out all sessions</h2><p className="mt-3 text-sm leading-relaxed text-muted">End access for all previously issued tokens. This also signs you out of this browser. Your books, points and profile are preserved.</p><Button variant="secondary" className="mt-5" disabled={busy} leftIcon={<LogOut size={16} />} onClick={() => { setSessionError(''); setConfirming(true); }}>Sign out all sessions</Button></Card>
    <dialog ref={dialog} aria-labelledby={titleId} aria-describedby={descriptionId} onCancel={event => { event.preventDefault(); close(); }} className="dark m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-lg overflow-y-auto rounded-2xl border border-muted-line bg-surface-raised p-5 text-ink backdrop:bg-black/65 sm:p-6"><div className="flex items-start justify-between gap-3"><h2 id={titleId} className="text-2xl font-semibold">Sign out everywhere?</h2><button type="button" aria-label="Close confirmation" disabled={busy} onClick={close} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-surface-sunken"><X size={20} /></button></div><p id={descriptionId} className="mt-3 text-sm leading-relaxed text-muted">Confirm with your current password. All existing sessions, including this one, will end. You will need to sign in again.</p><form onSubmit={submitSessions} className="mt-5 space-y-5"><PasswordInput label="Current password to confirm" autoComplete="current-password" value={sessionPassword} disabled={busy} required onChange={event => setSessionPassword(event.target.value)} />{sessionError && <p role="alert" className="break-words text-sm text-danger">{sessionError}</p>}<div className="flex flex-wrap justify-end gap-2"><Button variant="secondary" disabled={busy} onClick={close}>Cancel</Button><Button type="submit" disabled={busy} leftIcon={busy ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}>{busy ? 'Signing out...' : 'Confirm sign out'}</Button></div></form></dialog>
  </div>;
}
