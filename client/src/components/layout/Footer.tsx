import { Link } from 'react-router-dom';
import Logo from './Logo';

const COLUMNS = [
  {
    title: 'Explore',
    links: [
      { label: 'Browse books', to: '/search' },
      { label: 'Games', to: '/games' },
      { label: 'Daily tasks', to: '/tasks' },
    ],
  },
  {
    title: 'Community',
    links: [
      { label: 'Leaderboard', to: '/leaderboard' },
      { label: 'Profile', to: '/profile' },
      { label: 'Login', to: '/login' },
    ],
  },
] as const;

export default function Footer() {
  return (
    <footer className="bg-night text-night-fg">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr] lg:px-8">
        <div className="max-w-sm">
          <Logo inverted />
          <p className="mt-4 text-sm text-night-fg/75">
            Read. Play. Achieve. Turn reading into a habit you love with streaks, quick breaks and friendly competition.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h2 className="font-sans text-sm font-semibold uppercase tracking-wider text-accent">{col.title}</h2>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="rounded text-sm text-night-fg/80 transition hover:text-night-fg hover:underline">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-night-fg/15">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-night-fg/70 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>Books from Project Gutenberg (public domain).</p>
          <p>© 2026 Readora</p>
        </div>
      </div>
    </footer>
  );
}
