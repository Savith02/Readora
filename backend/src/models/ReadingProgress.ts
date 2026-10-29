import { Schema, model } from 'mongoose';
import type { InferSchemaType } from 'mongoose';

const readingProgressSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    /** Book id from the book API (Gutendex), kept as a string. */
    bookId: { type: String, required: true, trim: true },

    // Copied from the book API so "Continue reading" can render without calling it again.
    title: { type: String, required: true, trim: true },
    author: { type: String, default: '', trim: true },
    coverUrl: { type: String, default: null },

    currentPage: { type: Number, default: 0, min: 0 },
    totalPages: { type: Number, default: 0, min: 0 },
    /** 0-100 */
    progress: { type: Number, default: 0, min: 0, max: 100 },
    currentChapter: { type: Number, default: 1, min: 1 },
    completedChapters: { type: [Number], default: [] },

    lastReadAt: { type: Date, default: Date.now },
    finishedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// One progress record per user per book.
readingProgressSchema.index({ userId: 1, bookId: 1 }, { unique: true });
// "Continue reading": a user's books, most recently read first.
readingProgressSchema.index({ userId: 1, lastReadAt: -1 });

readingProgressSchema.index({ lastReadAt: -1 });
readingProgressSchema.index({ finishedAt: 1 });

export type ReadingProgressDoc = InferSchemaType<typeof readingProgressSchema>;
export const ReadingProgress = model('ReadingProgress', readingProgressSchema);
