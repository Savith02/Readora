import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

export type Role = 'user' | 'admin';

export interface AuthPayload {
  userId: string;
  role: Role;
}

const ALGORITHM = 'HS256';

export function signToken({ userId, role }: AuthPayload): string {
  return jwt.sign({ role }, env.JWT_SECRET, {
    subject: userId,
    algorithm: ALGORITHM,
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  });
}

/** Throws a JsonWebTokenError / TokenExpiredError when the token is bad. */
export function verifyToken(token: string): AuthPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET, { algorithms: [ALGORITHM] });
  if (typeof decoded === 'string' || !decoded.sub || (decoded.role !== 'user' && decoded.role !== 'admin')) {
    throw new jwt.JsonWebTokenError('invalid token payload');
  }
  return { userId: decoded.sub, role: decoded.role };
}
