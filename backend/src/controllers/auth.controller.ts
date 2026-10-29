import bcrypt from 'bcryptjs';


import type { RequestHandler } from 'express';
import type { HydratedDocument } from 'mongoose';
import { HttpError } from '../middleware/error.middleware';
import { User } from '../models';
import type { UserDoc } from '../models/User';
import { completePasswordReset, requestPasswordReset } from '../services/passwordReset.service';
import type { ForgotPasswordInput, LoginInput, RegisterInput, ResetPasswordInput } from '../validators/auth.validators';
import { signToken } from '../utils/jwt';
import { logger } from '../utils/logger';
import { BCRYPT_ROUNDS, hashPassword } from '../utils/password';

// Compared against when the email is unknown, so "no such user" takes as long as "wrong password"
// and the response time does not reveal which emails have accounts.
const TIMING_HASH = bcrypt.hashSync('readora-timing-equaliser', BCRYPT_ROUNDS);

/** The user fields that are safe to send to the browser (never the password hash). */
export const toPublicUser = (user: HydratedDocument<UserDoc>) => ({
  id: user.id as string,
  name: user.name,
  email: user.email,
  role: user.role,
  totalPoints: user.totalPoints,
  currentStreak: user.currentStreak,
  longestStreak: user.longestStreak,
  dailyGoalPages: user.dailyGoalPages,
});

const authResponse = (user: HydratedDocument<UserDoc>) => ({
  token: signToken({ userId: user.id as string, role: user.role, sessionVersion: user.sessionVersion ?? 0 }),
  user: toPublicUser(user),
});

export const register: RequestHandler = async (req, res) => {
  const { name, email, password } = req.body as RegisterInput;
  const role = 'user';


  if (await User.exists({ email })) throw new HttpError(409, 'An account with this email already exists');

  const passwordHash = await hashPassword(password);
  const user = await User.create({ name, email, passwordHash, role });

  res.status(201).json(authResponse(user));
};

export const login: RequestHandler = async (req, res) => {
  const { email, password } = req.body as LoginInput;

  const user = await User.findOne({ email }).select('+passwordHash +sessionVersion');
  const matches = await bcrypt.compare(password, user?.passwordHash ?? TIMING_HASH);
  if (!user || !matches) throw new HttpError(401, 'Invalid email or password');
  if (user.status === 'suspended') throw new HttpError(403, 'Your account is suspended. Please contact support.');

  res.json(authResponse(user));
};

/** The current user, used by the client on page load to confirm its saved token. */
export const me: RequestHandler = async (req, res) => {
  const user = req.auth ? await User.findById(req.auth.userId) : null;
  if (!user) throw new HttpError(401, 'Your account could not be found. Please log in again.');

  res.json({ user: toPublicUser(user) });
};

/** Always the same reply, so the form cannot be used to find out which emails have accounts. */
const FORGOT_PASSWORD_MESSAGE = 'If an account exists for that email, we have sent a link to reset the password.';

export const forgotPassword: RequestHandler = (req, res) => {
  const { email } = req.body as ForgotPasswordInput;

  // The work (database, email) continues after the reply is sent, so the answer, and how long it
  // takes, is the same whether or not the email has an account.
  void requestPasswordReset(email).catch((error: unknown) => {
    logger.error(`Password reset request failed: ${error instanceof Error ? error.message : String(error)}`);
  });

  res.json({ message: FORGOT_PASSWORD_MESSAGE });
};

export const resetPassword: RequestHandler = async (req, res) => {
  const { token, password } = req.body as ResetPasswordInput;

  await completePasswordReset(token, password);

  res.json({ message: 'Your password has been updated. You can sign in now.' });
};
