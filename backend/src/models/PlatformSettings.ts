import { Schema, model } from 'mongoose';
import { DEFAULT_PLATFORM_SETTINGS } from '@readora/shared';

// Only this fixed singleton ID is used by the service; there is no arbitrary key/value API.
const schema = new Schema({
  _id: { type: String, enum: ['platform'], default: 'platform' },
  displayName: { type: String, trim: true, minlength: 2, maxlength: 60, default: DEFAULT_PLATFORM_SETTINGS.displayName },
  description: { type: String, trim: true, maxlength: 500, default: DEFAULT_PLATFORM_SETTINGS.description },
  supportEmail: { type: String, trim: true, maxlength: 254, default: DEFAULT_PLATFORM_SETTINGS.supportEmail },
  logoStyle: { type: String, enum: ['book', 'app-icon'], default: DEFAULT_PLATFORM_SETTINGS.logoStyle },
  announcementEnabled: { type: Boolean, default: DEFAULT_PLATFORM_SETTINGS.announcementEnabled },
  announcementText: { type: String, trim: true, maxlength: 500, default: DEFAULT_PLATFORM_SETTINGS.announcementText },
  revision: { type: Number, min: 0, default: 0 },
}, { timestamps: true, versionKey: false, strict: 'throw' });
export const PlatformSettings = model('PlatformSettings', schema);
