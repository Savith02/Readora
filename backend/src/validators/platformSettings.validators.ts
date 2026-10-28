import { z } from 'zod';

const plainText = (max: number) => z.string().trim().max(max).refine(value => !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value), 'Unsupported control characters');
export const platformValuesSchema = z.object({
  displayName: plainText(60).pipe(z.string().min(2)),
  description: plainText(500),
  supportEmail: z.string().trim().pipe(z.union([z.literal(''), z.email().max(254)])),
  logoStyle: z.enum(['book', 'app-icon']),
  announcementEnabled: z.boolean(),
  announcementText: plainText(500),
}).strict().refine(value => !value.announcementEnabled || value.announcementText.length > 0, { path: ['announcementText'], message: 'Enter announcement text before enabling it' });
export const platformUpdateSchema = z.object({
  revision: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER - 1),
  settings: platformValuesSchema,
}).strict();
export type PlatformUpdate = z.infer<typeof platformUpdateSchema>;
