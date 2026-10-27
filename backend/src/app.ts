import cors from 'cors';
import express from 'express';
import { env } from './config/env';
import { errorHandler, notFound } from './middleware/error.middleware';
import { apiRouter } from './routes';

export const app = express();

// On Render/Vercel the app sits behind one proxy; without this every visitor looks like the
// proxy's IP to the rate limiter.
if (env.NODE_ENV === 'production') app.set('trust proxy', 1);

app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
app.use(express.json({ limit: '1mb' }));

app.use('/api', apiRouter);

// Swagger gets mounted here once config/swagger.ts is built.

app.use(notFound);
app.use(errorHandler);
