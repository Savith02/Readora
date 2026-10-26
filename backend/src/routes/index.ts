import { Router } from 'express';
import { authRouter } from './auth.routes';
import { booksRouter } from './books.routes';

/** Everything here is mounted under /api (see app.ts). */
export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/books', booksRouter);
