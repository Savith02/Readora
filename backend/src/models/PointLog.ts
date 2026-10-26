import { Schema, model } from 'mongoose';
import type { InferSchemaType } from 'mongoose';

export const POINT_REASONS = [
  'page_read',
  'chapter_done',
  'game_win',
  'task_complete',
  'daily_goal',
  'streak_bonus',
  'badge_bonus',
] as const;

/** Append-only ledger. User.totalPoints is the running sum of these entries. */
const pointLogSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    points: {
      type: Number,
      required: true,
      validate: { validator: (n: number) => Number.isInteger(n) && n !== 0, message: 'points must be a non-zero integer' },
    },
    reason: { type: String, enum: POINT_REASONS, required: true },
    bookId: { type: String, trim: true },
    /** The Task, GameResult or Badge this entry came from, when there is one. */
    refId: { type: Schema.Types.ObjectId },
  },
  // Entries are never edited, so there is no updatedAt.
  { timestamps: { createdAt: true, updatedAt: false } },
);

// A user's history, newest first.
pointLogSchema.index({ userId: 1, createdAt: -1 });
// Weekly leaderboard: sum points per user over a date range.
pointLogSchema.index({ createdAt: -1 });

export type PointLogDoc = InferSchemaType<typeof pointLogSchema>;
export const PointLog = model('PointLog', pointLogSchema);
