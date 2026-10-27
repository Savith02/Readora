import { api } from './client';

// Keep in sync with the backend's toPublicUser() (backend/src/controllers/auth.controller.ts).
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
  dailyGoalPages: number;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  accountType?: 'user' | 'admin';
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const registerUser = (payload: RegisterPayload) => api.post<AuthResponse>('/auth/register', payload).then((r) => r.data);

export const loginUser = (payload: LoginPayload) => api.post<AuthResponse>('/auth/login', payload).then((r) => r.data);

export const fetchCurrentUser = () => api.get<{ user: AuthUser }>('/auth/me').then((r) => r.data.user);

export interface ResetPasswordPayload {
  /** The token from the emailed link. */
  token: string;
  password: string;
}

/** Always succeeds with the same message, whether or not the email has an account. */
export const requestPasswordReset = (email: string) =>
  api.post<{ message: string }>('/auth/forgot-password', { email }).then((r) => r.data);

export const resetPassword = (payload: ResetPasswordPayload) =>
  api.post<{ message: string }>('/auth/reset-password', payload).then((r) => r.data);
