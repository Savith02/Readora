import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Activity, Award, BarChart3, Bell, BookOpen, ChevronRight, FolderTree, Gamepad2, LayoutDashboard, ListChecks, LogOut, Menu, MessageCircle, PanelLeftClose, PanelLeftOpen, PenLine, ShieldCheck, Star, Trophy, Users, X } from 'lucide-react';
import Logo from '../../components/layout/Logo';
import Avatar from '../../components/layout/Avatar';
import { useAuth } from '../../hooks/useAuth';
import { usePlatformSettings } from '../../store/platformSettingsStore';

// Keep these names stable: AppRoutes uses them to register the existing planned pages.
export const modules = ['Reports & Analytics', 'Manage Books', 'Categories & Genres', 'Authors', 'Reviews & Ratings', 'Games Management', 'Tasks & Challenges', 'Leaderboard & Points', 'Achievements & Badges', 'User Management', 'Reading Activity', 'Notifications', 'Feedback & Support', 'Admin Settings & Security'];
export const modulePath = (name: string) => name === 'User Management' ? 'users' : name === 'Admin Settings & Security' ? 'settings' : name.toLowerCase().replace(/[^a-z]+/g, '-').replace(/-$/, '');
const groups = [
  { label: 'Overview', items: [{ name: 'Dashboard', icon: LayoutDashboard }, { name: modules[0], icon: BarChart3 }] },
  { label: 'Library Management', items: [{ name: modules[1], icon: BookOpen }, { name: modules[2], icon: FolderTree }, { name: modules[3], icon: PenLine }, { name: modules[4], icon: Star }] },
  { label: 'Gamification', items: [{ name: modules[5], icon: Gamepad2 }, { name: modules[6], icon: ListChecks }, { name: modules[7], icon: Trophy }, { name: modules[8], icon: Award }] },
  { label: 'Community', items: [{ name: modules[9], icon: Users }, { name: modules[10], icon: Activity }] },
  { label: 'System', items: [{ name: modules[11], icon: Bell }, { name: modules[12], icon: MessageCircle }, { name: modules[13], icon: ShieldCheck }] },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const displayName = usePlatformSettings(state => state.settings.displayName);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const drawer = useRef<HTMLDialogElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const closeDrawer = () => { drawer.current?.close(); setMobileOpen(false); };
  useEffect(() => { drawer.current?.close(); setMobileOpen(false); }, [location.pathname]);
  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)');
    const closeOnDesktop = () => { if (desktop.matches) { drawer.current?.close(); setMobileOpen(false); } };
    desktop.addEventListener('change', closeOnDesktop);
    return () => desktop.removeEventListener('change', closeOnDesktop);
  }, []);
  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [mobileOpen]);
  const currentPage = location.pathname.startsWith('/admin/users') ? 'User Management' : location.pathname.endsWith('/dashboard') ? 'Dashboard' : modules.find(name => location.pathname.endsWith(`/${modulePath(name)}`)) ?? 'Administration';
  const signOut = () => { closeDrawer(); logout(); navigate('/login', { replace: true }); };

  const navigation = (compact = false) => <nav aria-label="Administration" className="space-y-5 py-5">
    {groups.map(group => <div key={group.label}>
      {compact ? <div className="mx-3 mb-3 h-px bg-muted-line/60" /> : <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">{group.label}</p>}
      <div className="space-y-1">{group.items.map(({ name, icon: Icon }) => {
        const planned = name !== 'Dashboard' && name !== 'User Management' && name !== 'Admin Settings & Security';
        return <NavLink key={name} to={`/admin/${name === 'Dashboard' ? 'dashboard' : modulePath(name)}`} onClick={() => { if (mobileOpen) closeDrawer(); }} title={compact ? `${name}${planned ? ' (planned)' : ''}` : undefined} className={({ isActive }) => `group flex min-h-11 items-center rounded-xl border text-[13px] font-medium transition-colors ${compact ? 'justify-center px-2' : 'gap-3 px-3'} ${isActive ? 'border-accent/20 bg-accent/10 text-accent' : 'border-transparent text-muted hover:bg-surface-sunken hover:text-ink'}`}>
          <Icon size={17} strokeWidth={1.8} className="shrink-0" aria-hidden="true" />
          <span className={compact ? 'sr-only' : 'min-w-0 flex-1'}>{name}</span>
          {planned && <span className={compact ? 'sr-only' : 'rounded border border-muted-line/60 px-1.5 py-0.5 text-[9px] font-normal text-muted'}>{compact ? '(planned)' : 'Soon'}</span>}
        </NavLink>;
      })}</div>
    </div>)}
  </nav>;
  const profile = (compact = false) => <div className="shrink-0 border-t border-muted-line/60 p-3">
    <Link to="/admin/settings" aria-label="Open your admin profile settings" title={compact ? 'Profile settings' : undefined} onClick={() => { if (mobileOpen) closeDrawer(); }} className={`flex items-center gap-3 rounded-xl bg-surface-sunken/60 p-2 transition hover:bg-accent/10 ${compact ? 'justify-center' : ''}`}>
      <Avatar name={user?.name ?? 'Admin'} className="h-9 w-9 rounded-xl bg-accent/15 text-accent" />
      {!compact && <div className="min-w-0"><p className="truncate text-sm font-semibold" title={user?.name}>{user?.name}</p><p className="mt-0.5 text-[11px] text-muted">Administrator</p></div>}
    </Link>
    <button type="button" title={compact ? 'Logout' : undefined} onClick={signOut} className={`mt-2 flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm text-muted transition hover:bg-danger/10 hover:text-danger ${compact ? 'justify-center' : ''}`}><LogOut size={17} aria-hidden="true" /><span className={compact ? 'sr-only' : ''}>Logout</span></button>
  </div>;

  return <div className="dark min-h-screen bg-surface font-sans text-ink">
    <a href="#admin-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-accent focus:p-3 focus:text-accent-fg">Skip to content</a>
    <aside id="admin-sidebar" aria-label="Admin sidebar" className={`fixed inset-y-0 left-0 z-20 hidden flex-col border-r border-muted-line/60 bg-surface-raised lg:flex ${collapsed ? 'w-20' : 'w-72'}`}>
      <div className={`flex h-20 shrink-0 items-center border-b border-muted-line/60 ${collapsed ? 'justify-center' : 'justify-between px-6'}`}>
        {collapsed ? <Logo compact inverted /> : <Logo inverted />}
        {!collapsed && <span className="rounded-md border border-accent/20 px-2 py-1 text-[9px] uppercase tracking-wider text-accent">Admin</span>}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3">{navigation(collapsed)}</div>
      {profile(collapsed)}
      <button type="button" aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-controls="admin-sidebar" aria-expanded={!collapsed} className="flex h-11 shrink-0 items-center justify-center gap-2 border-t border-muted-line/60 text-xs text-muted transition hover:bg-surface-sunken hover:text-accent" onClick={() => setCollapsed(!collapsed)}>
        {collapsed ? <PanelLeftOpen size={17} aria-hidden="true" /> : <><PanelLeftClose size={17} aria-hidden="true" />Collapse sidebar</>}
      </button>
    </aside>
    <dialog id="admin-mobile-navigation" ref={drawer} aria-label="Admin navigation" onClose={() => setMobileOpen(false)} onClick={event => { if (event.target === drawer.current) closeDrawer(); }} className="dark fixed inset-y-0 left-0 m-0 h-dvh max-h-none w-80 max-w-[90vw] overflow-hidden border-r border-muted-line bg-surface-raised p-0 text-ink backdrop:bg-black/60">
      <div className="flex h-full min-h-0 flex-col"><div className="flex h-20 shrink-0 items-center justify-between border-b border-muted-line/60 px-5"><Logo inverted /><button type="button" aria-label="Close navigation" className="flex h-11 w-11 items-center justify-center rounded-lg text-muted hover:bg-surface-sunken" onClick={closeDrawer}><X size={21} /></button></div><div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3">{navigation()}</div>{profile()}</div>
    </dialog>
    <div className={`min-w-0 ${collapsed ? 'lg:pl-20' : 'lg:pl-72'}`}>
      <header className="flex h-20 items-center justify-between gap-3 border-b border-muted-line/60 bg-surface/95 px-4 sm:px-8">
        <div className="flex min-w-0 items-center gap-3"><button type="button" aria-label="Open admin navigation" aria-haspopup="dialog" aria-controls="admin-mobile-navigation" aria-expanded={mobileOpen} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-surface-raised lg:hidden" onClick={() => { drawer.current?.showModal(); setMobileOpen(true); }}><Menu size={22} /></button><div className="flex min-w-0 items-center gap-2 text-xs"><span className="hidden text-muted sm:inline">Administration</span><ChevronRight size={13} className="hidden text-muted sm:block" aria-hidden="true" /><span className="truncate font-medium">{currentPage}</span></div></div>
        <div className="flex shrink-0 items-center gap-3"><Link to="/" className="max-w-[7rem] truncate rounded-lg px-2 py-2 text-xs text-muted transition hover:text-accent sm:max-w-[12rem]">View {displayName} <span aria-hidden="true">&#8599;</span></Link><span className="h-6 w-px bg-muted-line" /><Avatar name={user?.name ?? 'Admin'} className="h-8 w-8 rounded-full bg-accent/15 text-accent" /></div>
      </header>
      <main id="admin-content" tabIndex={-1} className="mx-auto min-w-0 max-w-[1600px] p-4 outline-none sm:p-6 xl:p-8"><Outlet /></main>
    </div>
  </div>;
}
