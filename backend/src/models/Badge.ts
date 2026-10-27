import { Schema, model } from 'mongoose';
import type { InferSchemaType } from 'mongoose';

export const BADGE_METRICS = ['pages_read', 'chapters_done', 'streak_days', 'games_won', 'total_points'] as const;

/** A badge definition. Which users earned it is stored on User.badges. */
const badgeSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    /** An icon name the client maps to an icon, e.g. "flame". */
    icon: { type: String, default: 'award', trim: true },
    /** Earned once the user's `metric` reaches `threshold`. */
    criteria: {
      metric: { type: String, enum: BADGE_METRICS, required: true },
      threshold: { type: Number, required: true, min: 1 },
    },
    rewardPoints: { type: Number, default: 0, min: 0 },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export type BadgeDoc = InferSchemaType<typeof badgeSchema>;
export const Badge = model('Badge', badgeSchema);
