import { BOOK_SOURCES } from '@readora/shared';
import type { BookSource } from '@readora/shared';
import { z } from 'zod';

// A book id ends up inside the URL of an upstream request, so each source's ids are checked
// strictly (digits, "OL123W", slugs...). This also rules out path tricks like "../".
const ID_PATTERNS: Record<BookSource, RegExp> = {
  gutendex: /^\d{1,8}$/,
  standardebooks: /^[a-z0-9-]+(~[a-z0-9-]+){1,2}$/,
  openlibrary: /^OL\d{1,12}W$/,
  google: /^[A-Za-z0-9_-]{4,32}$/,
};

const sourceEnum = z.enum(BOOK_SOURCES);

export const searchQuerySchema = z.object({
  q: z.string().trim().min(1, 'Enter something to search for').max(100, 'Search is limited to 100 characters'),
  page: z.coerce.number().int().min(1).max(100).default(1),
  // An empty ?source= means "all sources".
  source: z.preprocess((value) => (value === '' ? undefined : value), sourceEnum.optional()),
});

export const bookParamsSchema = z
  .object({
    source: sourceEnum,
    sourceId: z.string().trim().min(1).max(200),
  })
  .superRefine((params, ctx) => {
    if (!ID_PATTERNS[params.source].test(params.sourceId)) {
      ctx.addIssue({ code: 'custom', path: ['sourceId'], message: `That is not a valid ${params.source} book id` });
    }
  });

export const contentQuerySchema = z.object({
  chapter: z.coerce.number().int().min(1).optional(),
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;
export type BookParams = z.infer<typeof bookParamsSchema>;
export type ContentQuery = z.infer<typeof contentQuerySchema>;
