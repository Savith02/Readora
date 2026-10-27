import AdminRoute from './AdminRoute';
import AdminLayout, { modules, modulePath } from '../pages/admin/AdminLayout';
import AdminDashboard from '../pages/admin/AdminDashboard';
import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import ComingSoon from '../pages/ComingSoon';
import Home from '../pages/Home';
import ForgotPassword from '../pages/auth/ForgotPassword';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import ResetPassword from '../pages/auth/ResetPassword';
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
      <Route element={<ProtectedRoute />}>
        <Route element={<AdminRoute />}>
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            {modules.map(name => <Route key={name} path={modulePath(name)} element={<div className="rounded-2xl border border-muted-line bg-surface-raised p-8"><p className="text-xs uppercase tracking-widest text-accent">Planned module</p><h1 className="mt-3 text-3xl">{name}</h1><p className="mt-3 text-muted">This module is not implemented yet. Management actions will be available in a later phase.</p></div>} />)}
            <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
          </Route>
        </Route>
      </Route>
      <Route element={<AppLayout />}>
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password" element={<ResetPassword />} />

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
