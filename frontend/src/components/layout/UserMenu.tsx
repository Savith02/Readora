import { ChevronDown, LogOut, User as UserIcon } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { AuthUser } from '../../api/auth.api';
import { cn } from '../../utils/cn';
import Avatar from './Avatar';

interface UserMenuProps {
  user: AuthUser;
  onLogout: () => void;
}

const ITEM = 'flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm transition hover:bg-surface-sunken';

/** Account dropdown for the desktop navbar (the mobile drawer has its own entries). */
export default function UserMenu({ user, onLogout }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const { pathname } = useLocation();

  // Close when the page changes.
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative hidden lg:block">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`Account menu for ${user.name}`}
        className="flex items-center gap-1 rounded-md"
      >
        <Avatar name={user.name} />
        <ChevronDown size={16} className={cn('text-ink/70 transition-transform', open && 'rotate-180')} aria-hidden="true" />
      </button>

      {open && (
        <div id={panelId} className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-muted-line/70 bg-surface-raised text-ink shadow-lift">
          <div className="border-b border-muted-line/70 px-4 py-3">
            <p className="truncate font-semibold">{user.name}</p>
            <p className="truncate text-xs text-muted">{user.email}</p>
          </div>
          <Link to="/profile" className={ITEM}>
            <UserIcon size={16} aria-hidden="true" />
            Profile
          </Link>
          <button type="button" onClick={onLogout} className={ITEM}>
            <LogOut size={16} aria-hidden="true" />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
