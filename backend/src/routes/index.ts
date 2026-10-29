import { Router } from 'express';
import { authRouter } from './auth.routes';
import { publicPlatformRouter } from './platformSettings.routes';

/** Everything here is mounted under /api (see app.ts). */
export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/platform-settings', publicPlatformRouter);

import { adminRouter } from './admin.routes';
apiRouter.use('/admin', adminRouter);
