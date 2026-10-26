import bcrypt from 'bcryptjs';
import type { RequestHandler } from 'express';
import type { HydratedDocument } from 'mongoose';
import { HttpError } from '../middleware/error.middleware';
import { User } from '../models';
import type { UserDoc } from '../models/User';
import type { LoginInput, RegisterInput } from '../validators/auth.validators';
import { signToken } from '../utils/jwt';

const BCRYPT_ROUNDS = 12;

// Compared against when the email is unknown, so "no such user" takes as long as "wrong password"
// and the response time does not reveal which emails have accounts.
const TIMING_HASH = bcrypt.hashSync('readora-timing-equaliser', BCRYPT_ROUNDS);

/** The user fields that are safe to send to the browser (never the password hash). */
const toPublicUser = (user: HydratedDocument<UserDoc>) => ({
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
  token: signToken({ userId: user.id as string, role: user.role }),
  user: toPublicUser(user),
});

export const register: RequestHandler = async (req, res) => {
  const { name, email, password } = req.body as RegisterInput;

  if (await User.exists({ email })) throw new HttpError(409, 'An account with this email already exists');

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = await User.create({ name, email, passwordHash });

  res.status(201).json(authResponse(user));
};

export const login: RequestHandler = async (req, res) => {
  const { email, password } = req.body as LoginInput;

  const user = await User.findOne({ email }).select('+passwordHash');
  const matches = await bcrypt.compare(password, user?.passwordHash ?? TIMING_HASH);
  if (!user || !matches) throw new HttpError(401, 'Invalid email or password');

  res.json(authResponse(user));
};

/** The current user, used by the client on page load to confirm its saved token. */
export const me: RequestHandler = async (req, res) => {
  const user = req.auth ? await User.findById(req.auth.userId) : null;
  if (!user) throw new HttpError(401, 'Your account could not be found. Please log in again.');

  res.json({ user: toPublicUser(user) });
};
