import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import mongoose from 'mongoose';
import { env } from '../config/env';
import { HttpError } from '../middleware/error.middleware';
import { User } from '../models';
import { hashPassword } from '../utils/password';
import { sendPasswordResetEmail } from './email.service';

const TOKEN_LIFETIME_MS = 60 * 60 * 1000;
/** A second request inside this window sends no second email (stops the form being used to flood an inbox). */
const RESEND_COOLDOWN_MS = 60 * 1000;

export const INVALID_LINK_MESSAGE = 'This reset link is invalid or has expired. Please request a new one.';

const sha256 = (value: string): string => createHash('sha256').update(value).digest('hex');

const sameHash = (a: string, b: string): boolean =>
  a.length === b.length && timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));

/**
 * Starts a reset for the account with this email, if there is one. The emailed link carries
 * "<user id>.<random secret>"; only the secret's hash is stored, so a copy of the database
 * cannot be used to reset anyone's password. Silent when the email is unknown.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  const user = await User.findOne({ email }).select('+resetTokenExpiresAt');
  if (!user) return;

  if (user.resetTokenExpiresAt) {
    const issuedAt = user.resetTokenExpiresAt.getTime() - TOKEN_LIFETIME_MS;
    if (Date.now() - issuedAt < RESEND_COOLDOWN_MS) return;
  }

  const secret = randomBytes(32).toString('base64url');
  // A new request replaces any earlier link, which stops working.
  await User.updateOne(
    { _id: user._id },
    { $set: { resetTokenHash: sha256(secret), resetTokenExpiresAt: new Date(Date.now() + TOKEN_LIFETIME_MS) } },
  );

  const link = `${env.CLIENT_ORIGIN}/reset-password?token=${encodeURIComponent(`${user.id}.${secret}`)}`;
  await sendPasswordResetEmail({ to: user.email, name: user.name, link, validForMinutes: TOKEN_LIFETIME_MS / 60_000 });
}

/**
 * Sets a new password from an emailed link. Every way a link can be wrong (malformed, unknown
 * account, wrong secret, expired, already used) gives the same error.
 */
export async function completePasswordReset(token: string, newPassword: string): Promise<void> {
  const separator = token.indexOf('.');
  const userId = separator > 0 ? token.slice(0, separator) : '';
  const secret = separator > 0 ? token.slice(separator + 1) : '';
  if (!secret || !mongoose.isValidObjectId(userId)) throw new HttpError(400, INVALID_LINK_MESSAGE);

  const user = await User.findById(userId).select('+resetTokenHash +resetTokenExpiresAt');
  const stored = user?.resetTokenHash;
  const valid = Boolean(stored && user?.resetTokenExpiresAt && user.resetTokenExpiresAt.getTime() > Date.now() && sameHash(sha256(secret), stored));
  if (!user || !stored || !valid) throw new HttpError(400, INVALID_LINK_MESSAGE);

  const passwordHash = await hashPassword(newPassword);

  // The token is removed in the same update that sets the password, and the update only matches
  // while that exact token is still stored, so two requests with one link cannot both win.
  const result = await User.updateOne(
    { _id: user._id, resetTokenHash: stored },
    { $set: { passwordHash, passwordChangedAt: new Date() }, $inc: { sessionVersion: 1 }, $unset: { resetTokenHash: '', resetTokenExpiresAt: '' } },
  );
  if (result.modifiedCount !== 1) throw new HttpError(400, INVALID_LINK_MESSAGE);
}
