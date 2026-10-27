import { Schema, model } from 'mongoose';
import type { InferSchemaType } from 'mongoose';

/** One user's progress on one task for one period (day or week). */
const userTaskSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    taskId: { type: Schema.Types.ObjectId, ref: 'Task', required: true },
    /** "2026-10-26" for daily tasks, "2026-W43" for weekly ones. */
    periodKey: { type: String, required: true, trim: true },
    progress: { type: Number, default: 0, min: 0 },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
    rewardClaimed: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// A task is tracked once per user per period.
userTaskSchema.index({ userId: 1, taskId: 1, periodKey: 1 }, { unique: true });
// "Today's tasks" for a user.
userTaskSchema.index({ userId: 1, periodKey: 1 });

export type UserTaskDoc = InferSchemaType<typeof userTaskSchema>;
export const UserTask = model('UserTask', userTaskSchema);
