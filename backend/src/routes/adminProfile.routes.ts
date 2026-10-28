import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import type { HydratedDocument } from 'mongoose';
import { User } from '../models';
import type { UserDoc } from '../models/User';
import { toPublicUser } from '../controllers/auth.controller';
import { HttpError } from '../middleware/error.middleware';
import { validate } from '../middleware/validate.middleware';
import { adminProfileSchema } from '../validators/adminProfile.validators';

// Mounted under adminRouter's existing JWT, live role/status checks and no-store middleware.
export const adminProfileRouter = Router();
const fields = 'name email role status createdAt totalPoints currentStreak longestStreak dailyGoalPages';
const publicProfile = (user: HydratedDocument<UserDoc>) => ({
  ...toPublicUser(user),
  createdAt: user.createdAt ?? null,
  status: user.status === 'suspended' ? 'suspended' : 'active',
});
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, keyGenerator: req => req.auth!.userId, standardHeaders: 'draft-8', legacyHeaders: false, message: { message: 'Too many profile updates. Please try again later.' } });
adminProfileRouter.get('/', async (req, res) => {
  const user = await User.findOne({ _id: req.auth!.userId, role: 'admin', status: { $ne: 'suspended' } }).select(fields);
  if (!user) throw new HttpError(403, 'Active administrator access required.');
  res.json({ profile: publicProfile(user) });
});
adminProfileRouter.patch('/', limiter, validate(adminProfileSchema), async (req, res) => {
  // The target comes exclusively from the verified session, never from a client field or URL.
  const user = await User.findOneAndUpdate(
    { _id: req.auth!.userId, role: 'admin', status: { $ne: 'suspended' } },
    { $set: { name: req.body.name } },
    { returnDocument: 'after', runValidators: true },
  ).select(fields);
  if (!user) throw new HttpError(403, 'Active administrator access required.');
  res.json({ profile: publicProfile(user) });
});
