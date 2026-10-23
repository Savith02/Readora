import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { LogIn, Menu, Moon, Sun, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { NavLink } from 'react-router-dom';
import { getUserSummary } from '../../data/mockHome';
import { useAsync } from '../../hooks/useAsync';
import { useTheme } from '../../hooks/useTheme';
import { cn } from '../../utils/cn';
import PointsBadge from '../gamification/PointsBadge';
import StreakCounter from '../gamification/StreakCounter';
import Button from '../ui/Button';
import Logo from './Logo';

const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Browse', to: '/search' },
  { label: 'Games', to: '/games' },
  { label: 'Tasks', to: '/tasks' },
  { label: 'Leaderboard', to: '/leaderboard' },
] as const;

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'rounded-full px-3.5 py-2 text-sm font-medium transition',
    isActive ? 'bg-primary-soft text-primary' : 'text-muted hover:bg-surface-sunken hover:text-ink',
  );

const drawerLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'rounded-xl px-4 py-3 text-base font-medium transition',
    isActive ? 'bg-primary-soft text-primary' : 'text-ink hover:bg-surface-sunken',
  );

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { theme, toggle } = useTheme();
  const { data: user } = useAsync(getUserSummary);
  const reduce = useReducedMotion();

  // Close on Escape and lock page scroll while the drawer is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  const ThemeIcon = theme === 'dark' ? Sun : Moon;

  return (
    <header className="sticky top-0 z-40 border-b border-muted-line/70 bg-surface/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Logo />
          <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
            {NAV_LINKS.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.to === '/'} className={linkClass}>
                {l.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {user && (
            <div className="hidden items-center gap-2 sm:flex">
              <PointsBadge points={user.points} />
              <StreakCounter days={user.streak} />
            </div>
          )}
          <button
            type="button"
            onClick={toggle}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="flex h-10 w-10 items-center justify-center rounded-full text-ink transition hover:bg-surface-sunken"
          >
            <ThemeIcon size={20} aria-hidden="true" />
          </button>
          <Button to="/login" size="sm" variant="secondary" className="hidden sm:inline-flex" leftIcon={<LogIn size={16} aria-hidden="true" />}>
            Login
          </Button>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            aria-expanded={open}
            aria-controls="mobile-menu"
            className="flex h-10 w-10 items-center justify-center rounded-full text-ink transition hover:bg-surface-sunken lg:hidden"
          >
            <Menu size={22} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Portal: the header's backdrop-blur would otherwise become the containing block of the fixed drawer. */}
      {createPortal(
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              className="absolute inset-0 bg-night/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />
            <motion.aside
              id="mobile-menu"
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
              className="absolute inset-y-0 right-0 flex w-[min(20rem,85vw)] flex-col gap-6 bg-surface p-5 shadow-lift"
              initial={reduce ? { opacity: 0 } : { x: '100%' }}
              animate={reduce ? { opacity: 1 } : { x: 0 }}
              exit={reduce ? { opacity: 0 } : { x: '100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
            >
              <div className="flex items-center justify-between">
                <Logo />
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                  className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface-sunken"
                >
                  <X size={22} aria-hidden="true" />
                </button>
              </div>
              {user && (
                <div className="flex items-center gap-2">
                  <PointsBadge points={user.points} />
                  <StreakCounter days={user.streak} />
                </div>
              )}
              <nav aria-label="Mobile" className="flex flex-col gap-1">
                {NAV_LINKS.map((l) => (
                  <NavLink key={l.to} to={l.to} end={l.to === '/'} className={drawerLinkClass} onClick={() => setOpen(false)}>
                    {l.label}
                  </NavLink>
                ))}
              </nav>
              <Button to="/login" fullWidth onClick={() => setOpen(false)} leftIcon={<LogIn size={16} aria-hidden="true" />} className="mt-auto">
                Login
              </Button>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>,
        document.body,
      )}
    </header>
  );
}
