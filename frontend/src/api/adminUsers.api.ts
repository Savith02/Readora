import { api } from './client';
import type { AuthUser } from './auth.api';
export type UserRole = AuthUser['role'];
export type UserStatus = 'active' | 'suspended';
export interface ManagedUser {
  _id: string; name: string; email: string; role: UserRole; status: UserStatus; createdAt: string;
  lastReadAt?: string | null;
}
export interface UserStats { total: number; active: number; newThisMonth: number; suspended: number }
export interface UsersPage { users: ManagedUser[]; total: number; page: number; pageSize: number; totalPages: number }
export interface AuditEntry {
  _id: string; administratorId: { _id: string; name: string } | null; action: string; reason: string; previous: string; next: string; createdAt: string;
}
export interface AuditPage { logs: AuditEntry[]; total: number; page: number; pageSize: number; totalPages: number }
export interface UserProfile {
  user: ManagedUser & { totalPoints: number; currentStreak: number; longestStreak: number; suspensionReason: string; statusChangedAt: string | null; badges: { badgeId: { _id: string; name: string; description: string; icon: string } | null; earnedAt: string }[] };
  reading: { started: number; completed: number; lastReadAt: string | null; recent: { _id: string; bookId: string; title: string; author: string; progress: number; currentPage: number; totalPages: number; lastReadAt: string; finishedAt: string | null }[] };
  games: { played: number; wins: number; recent: { _id: string; gameType: string; score: number; maxScore: number; won: boolean; pointsAwarded: number; createdAt: string }[] };
  tasks: { completed: number; rewards: number; recent: { _id: string; title?: string; periodKey: string; rewardClaimed: boolean; completedAt: string | null }[]; current: { _id: string; title?: string; periodKey: string; progress: number; target: number; completed: boolean }[] };
  points: { balance: number; earned: number; readerRank: number | null };
}
export const fetchUsers = (params: URLSearchParams, signal?: AbortSignal) => api.get<UsersPage>('/admin/users', { params, signal }).then(r => r.data);
export const fetchUserStats = (signal?: AbortSignal) => api.get<UserStats>('/admin/users/stats', { signal }).then(r => r.data);
export const fetchUserProfile = (id: string, signal?: AbortSignal) => api.get<UserProfile>(`/admin/users/${id}`, { signal }).then(r => r.data);
export const fetchUserAudit = (id: string, page: number, signal?: AbortSignal) => api.get<AuditPage>(`/admin/users/${id}/audit-logs`, { params: { page }, signal }).then(r => r.data);
export const setUserStatus = (user: ManagedUser, status: UserStatus, reason: string) => api.patch<{ message: string }>(`/admin/users/${user._id}/status`, { status, expectedStatus: user.status, reason }).then(r => r.data);
export const setUserRole = (user: ManagedUser, role: UserRole, reason: string, password: string) => api.patch<{ message: string }>(`/admin/users/${user._id}/role`, { role, expectedRole: user.role, reason, password }).then(r => r.data);
