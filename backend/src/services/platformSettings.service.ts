import mongoose from 'mongoose';
import { DEFAULT_PLATFORM_SETTINGS } from '@readora/shared';
import type { PlatformSettingsSnapshot, PublicPlatformSettings } from '@readora/shared';
import { PlatformSettings, AdminAuditLog, User } from '../models';
import { HttpError } from '../middleware/error.middleware';
import type { PlatformUpdate } from '../validators/platformSettings.validators';
import type { AuthPayload } from '../utils/jwt';

export function publicSettings(row?: Partial<PublicPlatformSettings> | null): PublicPlatformSettings {
  // Explicit serialization protects public reads even if private metadata is added later.
  return {
    displayName: row?.displayName ?? DEFAULT_PLATFORM_SETTINGS.displayName,
    description: row?.description ?? DEFAULT_PLATFORM_SETTINGS.description,
    supportEmail: row?.supportEmail ?? DEFAULT_PLATFORM_SETTINGS.supportEmail, logoStyle: row?.logoStyle ?? DEFAULT_PLATFORM_SETTINGS.logoStyle,
    announcementEnabled: row?.announcementEnabled ?? DEFAULT_PLATFORM_SETTINGS.announcementEnabled, announcementText: row?.announcementText ?? DEFAULT_PLATFORM_SETTINGS.announcementText,
  };
}
export async function getPlatformSettings(): Promise<PlatformSettingsSnapshot> {
  const row = await PlatformSettings.findById('platform').lean();
  return { settings: publicSettings(row), revision: row?.revision ?? 0 };
}
export async function updatePlatformSettings(auth: AuthPayload, input: PlatformUpdate): Promise<PlatformSettingsSnapshot> {
  try {
    return await mongoose.connection.transaction(async session => {
      const actor = await User.findById(auth.userId).select('role status +sessionVersion').session(session).lean();
      if (!actor || actor.role !== 'admin' || actor.status === 'suspended' || (actor.sessionVersion ?? 0) !== (auth.sessionVersion ?? 0)) throw new HttpError(403, 'Active administrator session required.');
      const current = await PlatformSettings.findById('platform').session(session).lean();
      if ((current?.revision ?? 0) !== input.revision) throw new HttpError(409, 'Settings changed by another administrator. Reload the latest settings before saving.');
      const previous = publicSettings(current);
      if (JSON.stringify(previous) === JSON.stringify(publicSettings(input.settings))) return { settings: previous, revision: input.revision };
      const updated = await PlatformSettings.findOneAndUpdate({ _id: 'platform', revision: input.revision }, {
        $set: input.settings, $inc: { revision: 1 },
      }, { session, returnDocument: 'after', upsert: !current, runValidators: true, setDefaultsOnInsert: false }).lean();
      if (!updated) throw new HttpError(409, 'Settings changed. Reload before saving.');
      await AdminAuditLog.create([{
        administratorId: auth.userId, targetUserId: auth.userId, action: 'platform_settings_update',
        reason: 'Administrator updated public platform settings.', previous: JSON.stringify(previous), next: JSON.stringify(publicSettings(updated)),
      }], { session });
      return { settings: publicSettings(updated), revision: updated.revision };
    });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) throw new HttpError(409, 'Settings changed. Reload before saving.');
    if (/Transaction numbers are only allowed|does not support.*transaction/i.test(error instanceof Error ? error.message : '')) throw new HttpError(503, 'Saving settings requires MongoDB Atlas or a replica set. No changes were saved.');
    throw error;
  }
}
