import { useAuthStore } from '../store/authStore';

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const initializing = useAuthStore((s) => s.initializing);
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const logout = useAuthStore((s) => s.logout);

  return { user, isAuthenticated: user !== null, initializing, login, register, logout };
}
