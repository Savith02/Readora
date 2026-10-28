import { Router } from 'express';
import { authRouter } from './auth.routes';

/** Everything here is mounted under /api (see app.ts). */
export const apiRouter = Router();

apiRouter.use('/auth', authRouter);

import { adminRouter } from './admin.routes';
apiRouter.use('/admin', adminRouter);
