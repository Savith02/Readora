import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

export type Role = 'user' | 'admin';

export interface AuthPayload {
  userId: string;
  role: Role;
  sessionVersion?: number;
}

export interface VerifiedToken extends AuthPayload {
  /** When the token was issued, in seconds since 1970. */
  issuedAt: number;
}

const ALGORITHM = 'HS256';

export function signToken({ userId, role, sessionVersion = 0 }: AuthPayload): string {
  return jwt.sign({ role, sessionVersion }, env.JWT_SECRET, {
    subject: userId,
    algorithm: ALGORITHM,
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  });
}

/** Throws a JsonWebTokenError / TokenExpiredError when the token is bad. */
export function verifyToken(token: string): VerifiedToken {
  const decoded = jwt.verify(token, env.JWT_SECRET, { algorithms: [ALGORITHM] });
  if (typeof decoded === 'string' || !decoded.sub || typeof decoded.iat !== 'number' || (decoded.role !== 'user' && decoded.role !== 'admin')) {
    throw new jwt.JsonWebTokenError('invalid token payload');
  }
  const sessionVersion = decoded.sessionVersion ?? 0;
  if (!Number.isSafeInteger(sessionVersion) || sessionVersion < 0) throw new jwt.JsonWebTokenError('invalid session version');
  return { userId: decoded.sub, role: decoded.role, issuedAt: decoded.iat, sessionVersion };
}
