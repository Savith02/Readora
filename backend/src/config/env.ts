import dotenv from 'dotenv';
import { z } from 'zod';
import { logger } from '../utils/logger';

// Reads backend/.env (the working directory when started with `npm run ... -w backend`).
dotenv.config({ quiet: true });

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),
  MONGO_URI: z.string().regex(/^mongodb(\+srv)?:\/\//, 'must start with mongodb:// or mongodb+srv://'),
  JWT_SECRET: z.string().min(32, 'must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const problems = parsed.error.issues.map((issue) => `  - ${issue.path.join('.') || '(env)'}: ${issue.message}`);
  logger.error(`Invalid environment variables in backend/.env:\n${problems.join('\n')}`);
  process.exit(1);
}

export const env = parsed.data;
