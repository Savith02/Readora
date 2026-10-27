import cors from 'cors';
import express from 'express';
import { env } from './config/env';

export const app = express();

app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
app.use(express.json({ limit: '1mb' }));

// Routes, Swagger and the error handler get mounted here once those files are built.
