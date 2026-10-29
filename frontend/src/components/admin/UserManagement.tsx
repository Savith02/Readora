import { useEffect, useId, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Loader2, MoreHorizontal, ShieldCheck, X } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import PasswordInput from '../auth/PasswordInput';
import { useAuth } from '../../hooks/useAuth';
import type { ManagedUser } from '../../api/adminUsers.api';
import { setUserRole, setUserStatus } from '../../api/adminUsers.api';
import { parseApiError } from '../../utils/apiError';

export const formatDate = (value?: string | null) => value ? new Date(value).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'Not recorded';
export const controlClass = 'h-11 w-full min-w-0 rounded-xl border border-muted-line bg-surface-sunken px-3 text-sm text-ink';
export function StatusBadge({ status }: { status: ManagedUser['status'] }) {
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${status === 'suspended' ? 'border-danger/20 bg-danger/10 text-danger' : 'border-accent/20 bg-accent/10 text-accent'}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{status === 'suspended' ? 'Suspended' : 'Active'}</span>;
}
export function LoadingUsers() { return <div role="status" aria-label="Loading users" className="space-y-3"><span className="sr-only">Loading users</span>{[0, 1, 2, 3].map(i => <div key={i} className="h-20 animate-pulse rounded-xl bg-surface-sunken" />)}</div>; }
export function UserError({ message, retry }: { message: string; retry: () => void }) { return <Card role="alert" className="border-danger/30"><p className="text-sm text-danger">{message}</p><Button size="sm" className="mt-3" onClick={retry}>Try again</Button></Card>; }
export function Pagination({ page, pages, total, onPage, disabled = false }: { page: number; pages: number; total: number; onPage: (page: number) => void; disabled?: boolean }) {
  return <div className="flex flex-wrap items-center justify-between gap-3 border-t border-muted-line/60 pt-4"><p role="status" className="text-xs text-muted">{total.toLocaleString()} matching results{pages > 0 && ` / Page ${page} of ${pages}`}</p><div className="flex gap-2"><Button size="sm" variant="secondary" disabled={disabled || page <= 1} onClick={() => onPage(page - 1)} leftIcon={<ChevronLeft size={14} />}>Previous</Button><Button size="sm" variant="secondary" disabled={disabled || page >= pages} onClick={() => onPage(page + 1)} rightIcon={<ChevronRight size={14} />}>Next</Button></div></div>;
}
export type UserAction = { user: ManagedUser; kind: 'status' | 'role' };
export function UserActions({ user, onAction }: { user: ManagedUser; onAction: (action: UserAction) => void }) {
  const { user: actor } = useAuth();
  const self = actor?.id === user._id;
  return <details className="relative" onKeyDown={event => { if (event.key === 'Escape') { event.currentTarget.open = false; event.currentTarget.querySelector('summary')?.focus(); } }}>
    <summary aria-label={`Actions for ${user.name}`} className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-xl text-muted transition hover:bg-surface-sunken [&::-webkit-details-marker]:hidden"><MoreHorizontal size={20} /></summary>
    <div className="absolute right-0 top-full z-10 w-48 rounded-xl border border-muted-line bg-surface-sunken p-1.5 shadow-lift" onClick={event => { const details = event.currentTarget.closest('details'); if (details) details.open = false; }}>
      <Link to={`/admin/users/${user._id}`} className="flex min-h-11 items-center rounded-lg px-3 py-2.5 text-xs hover:bg-surface-raised">View profile</Link>
      <button type="button" disabled={self || user.role === 'admin'} onClick={() => onAction({ user, kind: 'status' })} className="min-h-11 w-full rounded-lg px-3 py-2.5 text-left text-xs hover:bg-surface-raised disabled:opacity-40" title={self || user.role === 'admin' ? 'Only other reader accounts can be suspended or reactivated' : undefined}>{user.status === 'suspended' ? 'Reactivate reader' : 'Suspend reader'}</button>
      <button type="button" disabled={self || user.status === 'suspended'} onClick={() => onAction({ user, kind: 'role' })} className="min-h-11 w-full rounded-lg px-3 py-2.5 text-left text-xs hover:bg-surface-raised disabled:opacity-40" title={self ? 'You cannot change your own role' : user.status === 'suspended' ? 'Reactivate before changing role' : undefined}>Change role</button>
    </div>
  </details>;
}
export function UserActionDialog({ action, onClose, onSaved }: { action: UserAction; onClose: () => void; onSaved: (message: string) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const reasonId = useId();
  const [reason, setReason] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { user, kind } = action;
  const nextStatus = user.status === 'suspended' ? 'active' : 'suspended';
  const nextRole = user.role === 'admin' ? 'user' : 'admin';
  const title = kind === 'role' ? `Change role to ${nextRole === 'admin' ? 'administrator' : 'reader'}?` : nextStatus === 'suspended' ? 'Suspend reader?' : 'Reactivate reader?';
  useEffect(() => {
    dialog.current?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { dialog.current?.close(); document.body.style.overflow = previous; };
  }, []);
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError('');
    if (reason.trim().length < 5) { setError('Provide a reason of at least 5 characters.'); return; }
    setSaving(true);
    try {
      const result = kind === 'role' ? await setUserRole(user, nextRole, reason.trim(), password) : await setUserStatus(user, nextStatus, reason.trim());
      onSaved(result.message);
    } catch (error) { setError(parseApiError(error).message); setSaving(false); }
  };
  return <dialog ref={dialog} aria-labelledby={titleId} aria-describedby={descriptionId} onCancel={event => { event.preventDefault(); if (!saving) onClose(); }} className="dark m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-lg overflow-y-auto rounded-2xl border border-muted-line bg-surface-raised p-5 text-ink shadow-lift backdrop:bg-black/65 sm:p-6">
    <div className="mb-4 flex items-start justify-between gap-3"><span className="rounded-xl bg-accent/10 p-2.5 text-accent"><ShieldCheck size={22} /></span><button type="button" aria-label="Close confirmation" disabled={saving} onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-lg text-muted hover:bg-surface-sunken disabled:opacity-40"><X size={20} /></button></div>
    <h2 id={titleId} className="text-2xl font-semibold">{title}</h2>
    <p id={descriptionId} className="mt-3 break-words text-sm leading-relaxed text-muted">{user.name} ({user.email}). {kind === 'role' ? 'This changes access privileges and ends existing sessions.' : nextStatus === 'suspended' ? 'The reader will be signed out and blocked from protected features. Reading progress, points and badges are preserved.' : 'The reader can sign in again. Their stored data will be preserved.'} This action will be recorded in the audit log.</p>
    <form onSubmit={submit} className="mt-5 space-y-4">
      <div><label htmlFor={reasonId} className="mb-2 block text-sm font-medium">Reason</label><textarea id={reasonId} required minLength={5} maxLength={1000} value={reason} disabled={saving} onChange={event => setReason(event.target.value)} className="min-h-24 w-full rounded-xl border border-muted-line bg-surface-sunken p-3 text-sm" /></div>
      {kind === 'role' && <PasswordInput label="Your current password" autoComplete="current-password" required value={password} disabled={saving} onChange={event => setPassword(event.target.value)} />}
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <div className="flex flex-wrap justify-end gap-2 pt-2"><Button variant="secondary" disabled={saving} onClick={onClose}>Cancel</Button><Button type="submit" disabled={saving} leftIcon={saving ? <Loader2 size={16} className="animate-spin" /> : undefined}>{saving ? 'Saving...' : 'Confirm change'}</Button></div>
    </form>
  </dialog>;
}
