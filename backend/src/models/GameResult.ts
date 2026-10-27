import { Schema, model } from 'mongoose';
import type { InferSchemaType } from 'mongoose';

export const GAME_TYPES = ['quiz', 'puzzle'] as const;

const gameResultSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    gameType: { type: String, enum: GAME_TYPES, required: true },
    /** The book the questions or words came from, if any. */
    bookId: { type: String, trim: true },
    score: { type: Number, required: true, min: 0 },
    maxScore: { type: Number, required: true, min: 1 },
    won: { type: Boolean, required: true },
    durationSeconds: { type: Number, default: 0, min: 0 },
    pointsAwarded: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

// A user's recent games.
gameResultSchema.index({ userId: 1, createdAt: -1 });
// Counting wins per user (badges, tasks).
gameResultSchema.index({ userId: 1, won: 1 });

export type GameResultDoc = InferSchemaType<typeof gameResultSchema>;
export const GameResult = model('GameResult', gameResultSchema);
