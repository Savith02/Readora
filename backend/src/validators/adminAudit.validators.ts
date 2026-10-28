import { z } from 'zod';
import { AUDIT_ACTIONS } from '../models/AdminAuditLog';

export const globalAuditQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(100000).default(1),
  pageSize: z.coerce.number().pipe(z.union([z.literal(10), z.literal(25), z.literal(50)])).default(10),
  action: z.enum(AUDIT_ACTIONS).optional(),
  from: z.iso.date().optional(),
  to: z.iso.date().optional(),
}).strict().refine(value => !value.from || !value.to || value.from <= value.to, { path: ['from'], message: 'Start date must not follow end date' });
export type AuditQuery = z.infer<typeof globalAuditQuerySchema>;
