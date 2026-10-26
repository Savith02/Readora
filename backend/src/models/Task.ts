import { Schema, model } from 'mongoose';
import type { InferSchemaType } from 'mongoose';

export const TASK_TYPES = ['pages', 'chapter', 'quiz', 'puzzle'] as const;
export const TASK_FREQUENCIES = ['daily', 'weekly'] as const;

/** A task definition. Each user's progress on it lives in UserTask. */
const taskSchema = new Schema(
  {
    /** Stable slug used by the seed script and the services, e.g. "read-10-pages". */
    key: { type: String, required: true, unique: true, lowercase: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    type: { type: String, enum: TASK_TYPES, required: true },
    frequency: { type: String, enum: TASK_FREQUENCIES, default: 'daily' },
    /** How many pages / chapters / wins complete the task. */
    target: { type: Number, required: true, min: 1 },
    rewardPoints: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

taskSchema.index({ isActive: 1, frequency: 1, sortOrder: 1 });

export type TaskDoc = InferSchemaType<typeof taskSchema>;
export const Task = model('Task', taskSchema);
