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
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const registerUser = (payload: RegisterPayload) => api.post<AuthResponse>('/auth/register', payload).then((r) => r.data);

export const loginUser = (payload: LoginPayload) => api.post<AuthResponse>('/auth/login', payload).then((r) => r.data);

export const fetchCurrentUser = () => api.get<{ user: AuthUser }>('/auth/me').then((r) => r.data.user);
