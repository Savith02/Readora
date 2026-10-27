import { z } from 'zod';

const email = z.string().trim().toLowerCase().pipe(z.email('Enter a valid email address'));

// bcrypt only uses the first 72 bytes of a password, so reject anything longer instead of truncating it.
const withinBcryptLimit = (value: string) => Buffer.byteLength(value, 'utf8') <= 72;

/** The rules for choosing a password (sign-up and reset). Login only checks that one was entered. */
const newPassword = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Za-z]/, 'Password must include a letter')
  .regex(/\d/, 'Password must include a number')
  .refine(withinBcryptLimit, 'Password is too long (72 bytes at most)');

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(50, 'Name must be at most 50 characters'),
  email,
  password: newPassword,
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Enter your password').refine(withinBcryptLimit, 'Password is too long (72 bytes at most)'),
});

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z.object({
  // "<user id>.<secret>" from the emailed link.
  token: z.string().trim().min(1, 'This reset link is not valid').max(300, 'This reset link is not valid'),
  password: newPassword,
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
