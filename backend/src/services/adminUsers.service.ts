import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User, AdminAuditLog, AdminMutationLock } from '../models';
import { HttpError } from '../middleware/error.middleware';
import type { AccessChange, UsersQuery } from '../validators/adminUsers.validators';

export const USER_FIELDS = 'name email role status createdAt lastReadDate totalPoints currentStreak longestStreak dailyGoalPages suspensionReason statusChangedAt';
export const accountStatus = (status: unknown): 'active' | 'suspended' => status === 'suspended' ? 'suspended' : 'active';
export const literalSearch = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export function userFilter(query: UsersQuery): Record<string, unknown> {
  const filter: Record<string, unknown> = {};
  if (query.role) filter.role = query.role;
  if (query.status) filter.status = query.status === 'active' ? { $ne: 'suspended' } : 'suspended';
  if (query.search) {
    const pattern = new RegExp(literalSearch(query.search), 'i');
    filter.$or = [{ name: pattern }, { email: pattern }];
  }
  if (query.from || query.to) filter.createdAt = {
    ...(query.from ? { $gte: new Date(`${query.from}T00:00:00Z`) } : {}),
    ...(query.to ? { $lt: new Date(new Date(`${query.to}T00:00:00Z`).getTime() + 86400000) } : {}),
  };
  return filter;
}

export function checkAccessPolicy(actorId: string, target: { id: string; role: string; status: unknown }, change: AccessChange, activeAdmins: number) {
  if (actorId === target.id) throw new HttpError(409, 'You cannot change your own role or account status.');
  if (change.kind === 'status') {
    if (target.role === 'admin') throw new HttpError(409, 'Administrator accounts cannot be suspended. Change the role first.');
    if (accountStatus(target.status) !== change.expectedStatus) throw new HttpError(409, 'Account status changed. Refresh and try again.');
    if (accountStatus(target.status) === change.status) throw new HttpError(409, 'The account already has this status.');
  } else {
    if (target.role !== change.expectedRole) throw new HttpError(409, 'Account role changed. Refresh and try again.');
    if (target.role === change.role) throw new HttpError(409, 'The account already has this role.');
    if (accountStatus(target.status) === 'suspended') throw new HttpError(409, 'Reactivate this account before changing its role.');
    if (target.role === 'admin' && change.role === 'user' && activeAdmins <= 1) throw new HttpError(409, 'The last active administrator cannot be demoted.');
  }
}

/** Atomic user update + audit. Never falls back to unaudited writes on standalone MongoDB. */
export async function changeUserAccess(actorId: string, targetId: string, change: AccessChange) {
  try {
    return await mongoose.connection.transaction(async session => {
      await AdminMutationLock.updateOne({ _id: 'user-management' }, { $inc: { version: 1 } }, { upsert: true, session });
      const actor = await User.findById(actorId).select('role status +passwordHash').session(session);
      if (!actor || actor.role !== 'admin' || accountStatus(actor.status) !== 'active') throw new HttpError(403, 'Active administrator access required.');
      if (change.kind === 'role' && !await bcrypt.compare(change.password, actor.passwordHash)) throw new HttpError(403, 'Your current password is incorrect.');
      const target = await User.findById(targetId).select(USER_FIELDS).session(session);
      if (!target) throw new HttpError(404, 'User not found');
      const count = await User.countDocuments({ role: 'admin', status: { $ne: 'suspended' } }).session(session);
      checkAccessPolicy(actorId, { id: target.id, role: target.role, status: target.status }, change, count);
      const previous = change.kind === 'role' ? target.role : accountStatus(target.status);
      const next = change.kind === 'role' ? change.role : change.status;
      const fields = change.kind === 'role' ? { role: change.role } : { status: change.status, suspensionReason: change.status === 'suspended' ? change.reason : '', statusChangedAt: new Date() };
      await User.updateOne({ _id: targetId }, { $set: fields, $inc: { sessionVersion: 1 } }, { session, runValidators: true });
      await AdminAuditLog.create([{
        administratorId: actorId, targetUserId: targetId,
        action: change.kind === 'role' ? 'role_change' : change.status === 'suspended' ? 'suspend' : 'reactivate',
        reason: change.reason, previous, next,
      }], { session });
      return { message: change.kind === 'role' ? 'Account role updated. Existing sessions ended.' : change.status === 'suspended' ? 'Reader suspended. Existing sessions ended.' : 'Reader reactivated. They can sign in again.' };
    });
  } catch (error) {
    if (error instanceof HttpError) throw error;
    const message = error instanceof Error ? error.message : '';
    if (/Transaction numbers are only allowed|does not support.*transaction/i.test(message)) throw new HttpError(503, 'Account changes require MongoDB transactions. Use a replica set or MongoDB Atlas. No changes were saved.');
    if ((error as { code?: number }).code === 11000) throw new HttpError(409, 'Another administrator is updating accounts. Please retry.');
    throw error;
  }
}
