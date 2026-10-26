import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Menu, Moon, Search, Sun, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { getUserSummary } from '../../data/mockHome';
import { useAsync } from '../../hooks/useAsync';
import { useTheme } from '../../hooks/useTheme';
import { cn } from '../../utils/cn';
import SearchBar from '../books/SearchBar';
import PointsBadge from '../gamification/PointsBadge';
import StreakCounter from '../gamification/StreakCounter';
import Logo from './Logo';

const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Browse', to: '/search' },
  { label: 'Games', to: '/games' },
  { label: 'Tasks', to: '/tasks' },
  { label: 'Leaderboard', to: '/leaderboard' },
] as const;

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn('rounded px-3 py-2 text-sm transition-colors', isActive ? 'font-semibold text-ink' : 'text-ink/70 hover:text-ink');

const drawerLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'rounded-xl px-4 py-3 text-base font-medium transition',
    isActive ? 'bg-primary-soft text-primary' : 'text-ink hover:bg-surface-sunken',
  );

function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <span aria-hidden="true" className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent font-semibold text-accent-fg', className)}>
      {name[0]?.toUpperCase()}
    </span>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();
  const { theme, toggle } = useTheme();
  const { data: user } = useAsync(getUserSummary);
  const reduce = useReducedMotion();

  // On Home the bar floats over the billboard and turns solid once the page scrolls.
  const overHero = pathname === '/' && !scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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
    // `dark` over the billboard forces light-on-dark colors there, whichever theme the page uses.
    <header className={cn('fixed inset-x-0 top-0 z-40', overHero && 'dark')}>
      <div
        aria-hidden="true"
        className={cn(
          'absolute inset-0 -z-10 border-b border-muted-line/60 bg-surface/95 backdrop-blur-md transition-opacity duration-300',
          overHero ? 'opacity-0' : 'opacity-100',
        )}
      />
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-x-0 top-0 -z-10 h-24 bg-gradient-to-b from-surface/85 to-transparent transition-opacity duration-300',
          overHero ? 'opacity-100' : 'opacity-0',
        )}
      />

      <div className="gutter flex h-16 items-center justify-between gap-3">
        <div className={cn('flex items-center gap-8', searchOpen && 'max-sm:hidden')}>
          <Logo />
          <nav aria-label="Main" className="hidden items-center lg:flex">
            {NAV_LINKS.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.to === '/'} className={linkClass}>
                {l.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className={cn('flex items-center gap-2', searchOpen && 'max-sm:flex-1')}>
          {searchOpen ? (
            <SearchBar size="md" autoFocus onDismiss={() => setSearchOpen(false)} className="w-full sm:w-80" />
          ) : (
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Search books"
              className="flex h-10 w-10 items-center justify-center rounded-full text-ink transition hover:bg-ink/10"
            >
              <Search size={20} aria-hidden="true" />
            </button>
          )}
          {user && (
            <div className="hidden items-center gap-2 md:flex">
              <PointsBadge points={user.points} />
              <StreakCounter days={user.streak} />
            </div>
          )}
          <button
            type="button"
            onClick={toggle}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="flex h-10 w-10 items-center justify-center rounded-full text-ink transition hover:bg-ink/10"
          >
            <ThemeIcon size={20} aria-hidden="true" />
          </button>
          {user && (
            <Link to="/profile" aria-label={`${user.name}, profile`} className="hidden rounded-md lg:block">
              <Avatar name={user.name} />
            </Link>
          )}
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            aria-expanded={open}
            aria-controls="mobile-menu"
            className="flex h-10 w-10 items-center justify-center rounded-full text-ink transition hover:bg-ink/10 lg:hidden"
          >
            <Menu size={22} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Portal: a blurred/filtered ancestor would become the containing block of the fixed drawer. */}
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
                className="absolute inset-y-0 right-0 flex w-[min(20rem,85vw)] flex-col gap-6 bg-surface p-5 text-ink shadow-lift"
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
                  <>
                    <Link to="/profile" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl bg-surface-sunken p-3">
                      <Avatar name={user.name} className="h-10 w-10" />
                      <span className="min-w-0">
                        <span className="block truncate font-semibold">{user.name}</span>
                        <span className="block text-xs text-muted">View profile</span>
                      </span>
                    </Link>
                    <div className="flex items-center gap-2">
                      <PointsBadge points={user.points} />
                      <StreakCounter days={user.streak} />
                    </div>
                  </>
                )}
                <nav aria-label="Mobile" className="flex flex-col gap-1">
                  {NAV_LINKS.map((l) => (
                    <NavLink key={l.to} to={l.to} end={l.to === '/'} className={drawerLinkClass} onClick={() => setOpen(false)}>
                      {l.label}
                    </NavLink>
                  ))}
                </nav>
              </motion.aside>
            </div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </header>
  );
}
