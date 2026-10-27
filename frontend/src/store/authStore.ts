import { create } from 'zustand';
import { fetchCurrentUser, loginUser, registerUser } from '../api/auth.api';
import type { AuthUser, LoginPayload, RegisterPayload } from '../api/auth.api';
import { setUnauthorizedHandler } from '../api/client';
import { clearToken, getToken, setToken } from '../utils/tokenStorage';

interface AuthState {
  user: AuthUser | null;
  /** True until the saved token (if there is one) has been checked once on startup. */
  initializing: boolean;
  init: () => Promise<void>;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
}

// React StrictMode runs effects twice in development; this keeps init to a single request.
let initialising: Promise<void> | null = null;

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  initializing: getToken() !== null,

  init: () => {
    initialising ??= (async () => {
      if (!getToken()) {
        set({ initializing: false });
        return;
      }
      try {
        set({ user: await fetchCurrentUser(), initializing: false });
      } catch {
        // A 401 already cleared the token (api/client.ts). Any other failure, such as the server
        // being down, keeps the token so the next page load can try again.
        set({ user: null, initializing: false });
      }
    })();
    return initialising;
  },

  login: async (payload) => {
    const { token, user } = await loginUser(payload);
    setToken(token);
    set({ user, initializing: false });
  },

  register: async (payload) => {
    const { token, user } = await registerUser(payload);
    setToken(token);
    set({ user, initializing: false });
  },

  logout: () => {
    clearToken();
    set({ user: null });
  },
}));

// When any request comes back 401, drop the user from the store as well.
setUnauthorizedHandler(() => useAuthStore.setState({ user: null }));
