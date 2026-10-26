import { Schema, model } from 'mongoose';
import type { InferSchemaType } from 'mongoose';

/**
 * Responses from the book APIs, kept so repeated requests do not hit them again.
 * Keys look like "search:gutendex:1:sherlock", "details:gutendex:1661", "content:gutendex:1661".
 * Google Books data is never stored here.
 */
const bookCacheSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    data: { type: Schema.Types.Mixed, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

// MongoDB deletes the document once expiresAt has passed (it checks about once a minute,
// so readers must still compare expiresAt themselves).
bookCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type BookCacheDoc = InferSchemaType<typeof bookCacheSchema>;
export const BookCache = model('BookCache', bookCacheSchema);
