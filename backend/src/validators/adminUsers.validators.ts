import { z } from 'zod';
import { HttpError } from '../middleware/error.middleware';

const day = z.iso.date().optional();
export const usersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(100000).default(1),
  pageSize: z.coerce.number().pipe(z.union([z.literal(10), z.literal(25), z.literal(50)])).default(10),
  search: z.string().trim().max(100).default(''),
  role: z.enum(['user', 'admin']).optional(),
  status: z.enum(['active', 'suspended']).optional(),
  from: day,
  to: day,
  sort: z.enum(['newest', 'oldest', 'name_asc', 'name_desc']).default('newest'),
}).strict().refine(value => !value.from || !value.to || value.from <= value.to, { message: 'Start date must not follow end date', path: ['from'] });
export const auditQuerySchema = z.object({ page: z.coerce.number().int().min(1).max(100000).default(1) }).strict();
export const statusChangeSchema = z.object({
  status: z.enum(['active', 'suspended']),
  expectedStatus: z.enum(['active', 'suspended']),
  reason: z.string().trim().min(5).max(1000),
}).strict();
export const roleChangeSchema = z.object({
  role: z.enum(['user', 'admin']),
  expectedRole: z.enum(['user', 'admin']),
  reason: z.string().trim().min(5).max(1000),
  password: z.string().min(1).refine(value => Buffer.byteLength(value, 'utf8') <= 72, 'Password is too long'),
}).strict();
export function parseQuery<T>(schema: z.ZodType<T>, value: unknown): T {
  const parsed = schema.safeParse(value);
  if (!parsed.success) throw new HttpError(400, parsed.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join('; '));
  return parsed.data;
}
export type UsersQuery = z.infer<typeof usersQuerySchema>;
export type AccessChange = ({ kind: 'status' } & z.infer<typeof statusChangeSchema>) | ({ kind: 'role' } & z.infer<typeof roleChangeSchema>);
