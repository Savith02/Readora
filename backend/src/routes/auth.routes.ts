import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { forgotPassword, login, me, register, resetPassword } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema } from '../validators/auth.validators';

const limiterOptions = {
  standardHeaders: 'draft-8',
  legacyHeaders: false,
} as const;

// Slows down password guessing: only failed logins count towards the limit.
const loginLimiter = rateLimit({
  ...limiterOptions,
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  message: { message: 'Too many failed login attempts. Please try again in 15 minutes.' },
});

const registerLimiter = rateLimit({
  ...limiterOptions,
  windowMs: 60 * 60 * 1000,
  limit: 20,
  message: { message: 'Too many sign-ups from this network. Please try again later.' },
});

// Every request here can send an email, so these are kept tight.
const forgotPasswordLimiter = rateLimit({
  ...limiterOptions,
  windowMs: 15 * 60 * 1000,
  limit: 5,
  message: { message: 'Too many password reset requests. Please try again in 15 minutes.' },
});

const resetPasswordLimiter = rateLimit({
  ...limiterOptions,
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: { message: 'Too many attempts. Please try again in 15 minutes.' },
});

export const authRouter = Router();

authRouter.post('/register', registerLimiter, validate(registerSchema), register);
authRouter.post('/login', loginLimiter, validate(loginSchema), login);
authRouter.get('/me', requireAuth, me);
authRouter.post('/forgot-password', forgotPasswordLimiter, validate(forgotPasswordSchema), forgotPassword);
authRouter.post('/reset-password', resetPasswordLimiter, validate(resetPasswordSchema), resetPassword);
