import type { RequestHandler } from 'express';
import { HttpError } from './error.middleware';

/** Must run after requireAuth: authorization uses the current database role. */
export const requireAdmin: RequestHandler = (req, _res, next) => {
  if (!req.auth) throw new HttpError(401, 'Please log in to continue');
  if (req.auth.role !== 'admin') throw new HttpError(403, 'Administrator access required');
  next();
};
