import { AdminAuditLog } from '../models';
import type { AuditQuery } from '../validators/adminAudit.validators';

export function auditFilter(query: AuditQuery, targetUserId?: string): Record<string, unknown> {
  return {
    ...(targetUserId ? { targetUserId } : {}),
    ...(query.action ? { action: query.action } : {}),
    ...(query.from || query.to ? { createdAt: {
      ...(query.from ? { $gte: new Date(`${query.from}T00:00:00Z`) } : {}),
      ...(query.to ? { $lt: new Date(new Date(`${query.to}T00:00:00Z`).getTime() + 86400000) } : {}),
    } } : {}),
  };
}

/** Shared by the global read-only view and existing user-specific history. */
export async function getAuditHistory(query: AuditQuery, targetUserId?: string) {
  const filter = auditFilter(query, targetUserId);
  let rows = AdminAuditLog.find(filter).sort({ createdAt: -1, _id: -1 }).skip((query.page - 1) * query.pageSize).limit(query.pageSize)
    .select('administratorId targetUserId action reason previous next createdAt').populate('administratorId', 'name');
  // Preserve the user-specific endpoint's existing targetUserId representation.
  if (!targetUserId) rows = rows.populate('targetUserId', 'name');
  const [total, logs] = await Promise.all([AdminAuditLog.countDocuments(filter), rows.lean()]);
  return { logs, total, page: query.page, pageSize: query.pageSize, totalPages: Math.ceil(total / query.pageSize) };
}
