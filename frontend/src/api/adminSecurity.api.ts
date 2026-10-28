import { api } from './client';
export interface PasswordChangePayload { currentPassword: string; newPassword: string; confirmPassword: string }
export interface SecurityMessage { message: string }
export const fetchAdminSecurity = (signal?: AbortSignal) => api.get<{ security: { passwordChangedAt: string | null } }>('/admin/security', { signal }).then(r => r.data.security);
export const changeAdminPassword = (payload: PasswordChangePayload) => api.post<SecurityMessage>('/admin/security/change-password', payload).then(r => r.data);
export const signOutAdminSessions = (currentPassword: string) => api.post<SecurityMessage>('/admin/security/sign-out-all', { currentPassword }).then(r => r.data);
