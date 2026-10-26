import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import ComingSoon from '../pages/ComingSoon';
import Home from '../pages/Home';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import ProtectedRoute from './ProtectedRoute';

// Pages that are not built yet render the shared "Coming soon" placeholder;
// swap the element for the real page when it is ready.
const PLACEHOLDERS = [
  { path: 'search', page: 'Search' },
  { path: 'book/:id', page: 'Book details' },
  { path: 'read/:id', page: 'Reader' },
  { path: 'games', page: 'Games' },
  { path: 'tasks', page: 'Tasks' },
  { path: 'leaderboard', page: 'Leaderboard' },
] as const;

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />

        {/* Needs a logged-in user. Add more login-only pages here. */}
        <Route element={<ProtectedRoute />}>
          <Route path="profile" element={<ComingSoon page="Profile" />} />
        </Route>

        {PLACEHOLDERS.map(({ path, page }) => (
          <Route key={path} path={path} element={<ComingSoon page={page} />} />
        ))}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
