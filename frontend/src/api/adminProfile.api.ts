import { api } from './client';
import type { AuthUser } from './auth.api';

export interface AdminProfile extends AuthUser {
  createdAt: string | null;
  status: 'active' | 'suspended';
}
export const fetchAdminProfile = (signal?: AbortSignal) => api.get<{ profile: AdminProfile }>('/admin/profile', { signal }).then(response => response.data.profile);
export const updateAdminProfile = (name: string) => api.patch<{ profile: AdminProfile }>('/admin/profile', { name }).then(response => response.data.profile);
