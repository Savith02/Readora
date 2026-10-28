import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { User } from '../models';
import { hashPassword } from '../utils/password';
import { HttpError } from '../middleware/error.middleware';
import { validate } from '../middleware/validate.middleware';
import { changePasswordSchema, endSessionsSchema } from '../validators/adminSecurity.validators';
import type { AuthPayload } from '../utils/jwt';

// Inherits adminRouter's existing authentication, live authorization and no-store headers.
export const adminSecurityRouter = Router();
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, keyGenerator: req => req.auth!.userId, standardHeaders: 'draft-8', legacyHeaders: false, message: { message: 'Too many security requests. Please try again in 15 minutes.' } });
const activeAdmin = (id: string) => ({ _id: id, role: 'admin' as const, status: { $ne: 'suspended' as const } });
adminSecurityRouter.get('/', async (req, res) => {
  const account = await User.findOne(activeAdmin(req.auth!.userId)).select('passwordChangedAt').lean();
  if (!account) throw new HttpError(403, 'Active administrator access required.');
  res.json({ security: { passwordChangedAt: account.passwordChangedAt ?? null } });
});
async function verifiedAccount(auth: AuthPayload, currentPassword: string) {
  const user = await User.findOne(activeAdmin(auth.userId)).select('+passwordHash +sessionVersion');
  if (!user || (user.sessionVersion ?? 0) !== (auth.sessionVersion ?? 0)) throw new HttpError(401, 'Your session has ended. Please sign in again.');
  if (!await bcrypt.compare(currentPassword, user.passwordHash)) throw new HttpError(403, 'Current password is incorrect.');
  return user;
}
const unchanged = (auth: AuthPayload, passwordHash: string) => ({
  ...activeAdmin(auth.userId), passwordHash,
  ...((auth.sessionVersion ?? 0) === 0 ? { $or: [{ sessionVersion: 0 }, { sessionVersion: { $exists: false } }] } : { sessionVersion: auth.sessionVersion }),
});
adminSecurityRouter.post('/change-password', limiter, validate(changePasswordSchema), async (req, res) => {
  const user = await verifiedAccount(req.auth!, req.body.currentPassword);
  if (await bcrypt.compare(req.body.newPassword, user.passwordHash)) throw new HttpError(400, 'Choose a new password different from your current password.');
  const passwordHash = await hashPassword(req.body.newPassword);
  const result = await User.updateOne(unchanged(req.auth!, user.passwordHash), {
    $set: { passwordHash, passwordChangedAt: new Date() },
    $inc: { sessionVersion: 1 },
    $unset: { resetTokenHash: '', resetTokenExpiresAt: '' },
  }, { runValidators: true });
  if (result.modifiedCount !== 1) throw new HttpError(401, 'Your account changed during this request. Please sign in again.');
  res.json({ message: 'Your password has been changed. All previous sessions have ended. Please sign in again.' });
});
adminSecurityRouter.post('/sign-out-all', limiter, validate(endSessionsSchema), async (req, res) => {
  const user = await verifiedAccount(req.auth!, req.body.currentPassword);
  const result = await User.updateOne(unchanged(req.auth!, user.passwordHash), { $inc: { sessionVersion: 1 } });
  if (result.modifiedCount !== 1) throw new HttpError(401, 'Your account changed during this request. Please sign in again.');
  res.json({ message: 'All previous sessions have ended. Please sign in again.' });
});
