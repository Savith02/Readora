import { z } from 'zod';
import { newPassword } from './auth.validators';

const currentPassword = z.string().min(1, 'Enter your current password').refine(value => Buffer.byteLength(value, 'utf8') <= 72, 'Password is too long (72 bytes at most)');
export const changePasswordSchema = z.object({
  currentPassword,
  newPassword,
  confirmPassword: z.string().min(1, 'Confirm your new password').max(72),
}).strict().refine(value => value.newPassword === value.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match' });
export const endSessionsSchema = z.object({ currentPassword }).strict();
