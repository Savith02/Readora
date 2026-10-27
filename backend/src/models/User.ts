import { Schema, model } from 'mongoose';
import type { InferSchemaType } from 'mongoose';

const earnedBadgeSchema = new Schema(
  {
    badgeId: { type: Schema.Types.ObjectId, ref: 'Badge', required: true },
    earnedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // Never returned unless a query asks for it with .select('+passwordHash').
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },

    totalPoints: { type: Number, default: 0, min: 0 },
    currentStreak: { type: Number, default: 0, min: 0 },
    longestStreak: { type: Number, default: 0, min: 0 },
    /** Last day the user read, used by the streak service to continue or reset the streak. */
    lastReadDate: { type: Date, default: null },
    dailyGoalPages: { type: Number, default: 20, min: 1, max: 1000 },

    badges: { type: [earnedBadgeSchema], default: [] },
  },
  { timestamps: true },
);

// All-time leaderboard.
userSchema.index({ totalPoints: -1 });

export type UserDoc = InferSchemaType<typeof userSchema>;
export const User = model('User', userSchema);
