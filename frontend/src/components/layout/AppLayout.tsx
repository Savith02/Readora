import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { cn } from '../../utils/cn';
import Footer from './Footer';
import Navbar from './Navbar';

export default function AppLayout() {
  const { pathname } = useLocation();
  const isHome = pathname === '/';

  // Start each page at the top when the route changes.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only z-50 rounded-full bg-primary px-4 py-2 text-primary-fg focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <Navbar />
      {/* The navbar is fixed. Home lets the billboard run under it; other pages clear it. */}
      <main id="main" className={cn('flex-1', !isHome && 'pt-16')}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
