import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import ComingSoon from '../pages/ComingSoon';
import Home from '../pages/Home';

// Only Home is built. Every other route renders the shared "Coming soon" placeholder
// until its page exists; swap the element for the real page when it is ready.
const PLACEHOLDERS = [
  { path: 'search', page: 'Search' },
  { path: 'book/:id', page: 'Book details' },
  { path: 'read/:id', page: 'Reader' },
  { path: 'games', page: 'Games' },
  { path: 'tasks', page: 'Tasks' },
  { path: 'leaderboard', page: 'Leaderboard' },
  { path: 'login', page: 'Login' },
  { path: 'profile', page: 'Profile' },
] as const;

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Home />} />
        {PLACEHOLDERS.map(({ path, page }) => (
          <Route key={path} path={path} element={<ComingSoon page={page} />} />
        ))}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
