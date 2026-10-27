import dotenv from 'dotenv';
import { z } from 'zod';
import { logger } from '../utils/logger';

// Reads backend/.env (the working directory when started with `npm run ... -w backend`).
dotenv.config({ quiet: true });

// A blank line in .env (`SMTP_HOST=`) counts as "not set".
const optionalString = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || undefined);

const schema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(5000),
    MONGO_URI: z.string().regex(/^mongodb(\+srv)?:\/\//, 'must start with mongodb:// or mongodb+srv://'),
    JWT_SECRET: z.string().min(32, 'must be at least 32 characters'),
    JWT_EXPIRES_IN: z.string().default('7d'),
    CLIENT_ORIGIN: z.string().default('http://localhost:5173'),

    // Outgoing email (password reset links). Optional: without it the link is printed in the
    // terminal in development, and no email is sent in production.
    SMTP_HOST: optionalString,
    SMTP_PORT: z.preprocess((value) => (value === '' ? undefined : value), z.coerce.number().int().min(1).max(65535).default(587)),
    SMTP_USER: optionalString,
    SMTP_PASS: optionalString,
    /** Shown as the sender, e.g. `Readora <you@gmail.com>`. Defaults to SMTP_USER. */
    EMAIL_FROM: optionalString,
  })
  .superRefine((env, ctx) => {
    const given = [env.SMTP_HOST, env.SMTP_USER, env.SMTP_PASS].filter(Boolean).length;
    if (given > 0 && given < 3) {
      ctx.addIssue({ code: 'custom', path: ['SMTP_HOST'], message: 'SMTP_HOST, SMTP_USER and SMTP_PASS must all be set together (or all left empty)' });
    }
  });

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const problems = parsed.error.issues.map((issue) => `  - ${issue.path.join('.') || '(env)'}: ${issue.message}`);
  logger.error(`Invalid environment variables in backend/.env:\n${problems.join('\n')}`);
  process.exit(1);
}

export const env = parsed.data;
