import axios from 'axios';
import { clearToken, getToken } from '../utils/tokenStorage';

// Default to the Vite proxy (/api -> backend), so the browser only ever talks to its own origin.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15_000,
});

let onUnauthorized: (() => void) | null = null;

/** The auth store registers itself here so this file does not import the store (no import cycle). */
export const setUnauthorizedHandler = (handler: (() => void) | null): void => {
  onUnauthorized = handler;
};

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    // A 401 on a normal request means the saved token expired or is invalid: log the user out.
    // A 401 from /auth/login is just a wrong password, so it is left to the login form.
    if (axios.isAxiosError(error) && error.response?.status === 401 && getToken() && !error.config?.url?.startsWith('/auth/login')) {
      clearToken();
      onUnauthorized?.();
    }
    return Promise.reject(error);
  },
);
