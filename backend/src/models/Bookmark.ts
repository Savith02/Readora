import { Schema, model } from 'mongoose';
import type { InferSchemaType } from 'mongoose';

const bookmarkSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    bookId: { type: String, required: true, trim: true },
    page: { type: Number, required: true, min: 0 },
    chapter: { type: Number, min: 1 },
    note: { type: String, default: '', trim: true, maxlength: 500 },
  },
  { timestamps: true },
);

// A page can be bookmarked once per user.
bookmarkSchema.index({ userId: 1, bookId: 1, page: 1 }, { unique: true });
bookmarkSchema.index({ userId: 1, createdAt: -1 });

export type BookmarkDoc = InferSchemaType<typeof bookmarkSchema>;
export const Bookmark = model('Bookmark', bookmarkSchema);
