import { Schema, model } from 'mongoose';

export const AUDIT_ACTIONS = ['suspend', 'reactivate', 'role_change', 'bootstrap_admin', 'password_change', 'sessions_revoked', 'platform_settings_update'] as const;

// No update/delete HTTP endpoints. Sensitive credentials are never accepted as audit metadata.
const adminAuditSchema = new Schema({
  administratorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, immutable: true },
  targetUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, immutable: true },
  action: { type: String, enum: AUDIT_ACTIONS, required: true, immutable: true },
  reason: { type: String, required: true, maxlength: 1000, immutable: true },
  previous: { type: String, required: true, immutable: true },
  next: { type: String, required: true, immutable: true },
}, { timestamps: { createdAt: true, updatedAt: false } });
adminAuditSchema.index({ targetUserId: 1, createdAt: -1, _id: -1 });
adminAuditSchema.index({ createdAt: -1, _id: -1 });
adminAuditSchema.index({ action: 1, createdAt: -1, _id: -1 });
export const AdminAuditLog = model('AdminAuditLog', adminAuditSchema);

// All role/status writers acquire this document inside their transaction. The write conflict
// forces concurrent operations to retry with a fresh snapshot before checking admin counts.
const lockSchema = new Schema({ _id: String, version: { type: Number, default: 0 } }, { versionKey: false });
export const AdminMutationLock = model('AdminMutationLock', lockSchema);
