import type { RequestHandler } from 'express';
import { isObjectIdOrHexString } from 'mongoose';
import { User } from '../models';
import { verifyToken } from '../utils/jwt';
import type { AuthPayload, VerifiedToken } from '../utils/jwt';
import { HttpError } from './error.middleware';

declare global {
  // Express's own extension point for adding fields to the request.
  namespace Express {
    interface Request {
      /** Set by requireAuth. */
      auth?: AuthPayload;
    }
  }
}

/**
 * Requires `Authorization: Bearer <jwt>`, then checks the account still exists and that the
 * password has not been changed since the token was issued. Puts the user on req.auth.
 */
export const requireAuth: RequestHandler = async (req, _res, next) => {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : '';
  if (!token) throw new HttpError(401, 'Please log in to continue');

  let payload: VerifiedToken;
  try {
    payload = verifyToken(token);
  } catch {
    // Expired, tampered with or malformed: all the same to the client.
    throw new HttpError(401, 'Your session has expired. Please log in again.');
  }

  if (!isObjectIdOrHexString(payload.userId)) throw new HttpError(401, 'Invalid session. Please log in again.');
  const user = await User.findById(payload.userId).select('role status passwordChangedAt +sessionVersion').lean();
  if (!user) throw new HttpError(401, 'Your account could not be found. Please log in again.');
  if (user.status === 'suspended') throw new HttpError(401, 'Your account is suspended. Please contact support.');
  if ((payload.sessionVersion ?? 0) !== (user.sessionVersion ?? 0)) throw new HttpError(401, 'Your session has ended. Please log in again.');

  // Compared in whole seconds (the token's resolution), so a token issued right after the change still works.
  if (user.passwordChangedAt && payload.issuedAt < Math.floor(user.passwordChangedAt.getTime() / 1000)) {
    throw new HttpError(401, 'Your password was changed. Please log in again.');
  }

  req.auth = { userId: payload.userId, role: user.role, sessionVersion: payload.sessionVersion ?? 0 };
  next();
};
