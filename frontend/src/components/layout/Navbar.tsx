import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { LogOut, Menu, Moon, Search, Sun, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { cn } from '../../utils/cn';
import SearchBar from '../books/SearchBar';
import PointsBadge from '../gamification/PointsBadge';
import StreakCounter from '../gamification/StreakCounter';
import Button from '../ui/Button';
import Avatar from './Avatar';
import Logo from './Logo';
import UserMenu from './UserMenu';

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

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();
  const { theme, toggle } = useTheme();
  const { user, logout } = useAuth();
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
  const closeDrawer = () => setOpen(false);

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
              <PointsBadge points={user.totalPoints} />
              <StreakCounter days={user.currentStreak} />
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
          {user ? (
            <UserMenu user={user} onLogout={logout} />
          ) : (
            <Button to="/login" variant="accent" size="sm" className="hidden sm:inline-flex">
              Login
            </Button>
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
                onClick={closeDrawer}
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
                    onClick={closeDrawer}
                    aria-label="Close menu"
                    className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface-sunken"
                  >
                    <X size={22} aria-hidden="true" />
                  </button>
                </div>
                {user && (
                  <>
                    <Link to="/profile" onClick={closeDrawer} className="flex items-center gap-3 rounded-xl bg-surface-sunken p-3">
                      <Avatar name={user.name} className="h-10 w-10" />
                      <span className="min-w-0">
                        <span className="block truncate font-semibold">{user.name}</span>
                        <span className="block text-xs text-muted">{user.role === 'admin' ? 'Administrator account' : 'Reader account'} � View profile</span>
                      </span>
                    </Link>
                    <div className="flex items-center gap-2">
                      <PointsBadge points={user.totalPoints} />
                      <StreakCounter days={user.currentStreak} />
                    </div>
                  </>
                )}
                <nav aria-label="Mobile" className="flex flex-col gap-1">{user?.role === 'admin' && <NavLink to="/admin/dashboard" className={drawerLinkClass} onClick={closeDrawer}>Admin Dashboard</NavLink>}
                  {NAV_LINKS.map((l) => (
                    <NavLink key={l.to} to={l.to} end={l.to === '/'} className={drawerLinkClass} onClick={closeDrawer}>
                      {l.label}
                    </NavLink>
                  ))}
                </nav>
                <div className="mt-auto flex flex-col gap-2">
                  {user ? (
                    <Button
                      variant="secondary"
                      fullWidth
                      leftIcon={<LogOut size={16} aria-hidden="true" />}
                      onClick={() => {
                        closeDrawer();
                        logout();
                      }}
                    >
                      Log out
                    </Button>
                  ) : (
                    <>
                      <Button to="/login" variant="accent" fullWidth onClick={closeDrawer}>
                        Login
                      </Button>
                      <Button to="/register" variant="secondary" fullWidth onClick={closeDrawer}>
                        Create account
                      </Button>
                    </>
                  )}
                </div>
              </motion.aside>
            </div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </header>
  );
}
