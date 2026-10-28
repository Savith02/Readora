import { api } from './client';
import type { AuditEntry } from './adminUsers.api';

export const auditActions = {
  suspend: 'Account suspension', reactivate: 'Account reactivation', role_change: 'Role change',
  bootstrap_admin: 'Administrator bootstrap', password_change: 'Password change', sessions_revoked: 'All sessions signed out',
} as const;
export interface GlobalAuditEntry extends AuditEntry { targetUserId: { _id: string; name: string } | null }
export interface GlobalAuditPage { logs: GlobalAuditEntry[]; total: number; page: number; pageSize: number; totalPages: number }
export const fetchAdminAudit = (params: URLSearchParams, signal?: AbortSignal) => api.get<GlobalAuditPage>('/admin/audit-logs', { params, signal }).then(response => response.data);
