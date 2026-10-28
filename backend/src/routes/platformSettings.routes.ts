import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { validate } from '../middleware/validate.middleware';
import { getPlatformSettings, updatePlatformSettings } from '../services/platformSettings.service';
import { platformUpdateSchema } from '../validators/platformSettings.validators';

export const publicPlatformRouter = Router();
publicPlatformRouter.get('/', async (_req, res) => {
  res.set('Cache-Control', 'no-store');
  const { settings } = await getPlatformSettings();
  res.json({ settings });
});
// Mounted under adminRouter's authentication, live authorization and no-store middleware.
export const adminPlatformRouter = Router();
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, keyGenerator: req => req.auth!.userId, standardHeaders: 'draft-8', legacyHeaders: false, message: { message: 'Too many settings updates. Try again in 15 minutes.' } });
adminPlatformRouter.get('/', async (_req, res) => { res.json(await getPlatformSettings()); });
adminPlatformRouter.patch('/', limiter, validate(platformUpdateSchema), async (req, res) => { res.json(await updatePlatformSettings(req.auth!, req.body)); });
