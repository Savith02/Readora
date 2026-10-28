import { z } from 'zod';

// Reject extra fields rather than silently accepting a mass-assignment attempt.
export const adminProfileSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(50, 'Name must be at most 50 characters'),
}).strict();
