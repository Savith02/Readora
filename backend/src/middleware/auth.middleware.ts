import type { RequestHandler } from 'express';
import { verifyToken } from '../utils/jwt';
import type { AuthPayload } from '../utils/jwt';
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

/** Requires `Authorization: Bearer <jwt>` and puts the token's user on req.auth. */
export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : '';
  if (!token) throw new HttpError(401, 'Please log in to continue');

  try {
    req.auth = verifyToken(token);
  } catch {
    // Expired, tampered with or malformed: all the same to the client.
    throw new HttpError(401, 'Your session has expired. Please log in again.');
  }
  next();
};
