import type { Book, BookSource } from '@readora/shared';

/** Only these sources may ever offer full text. Everything else is metadata only. */
const FULL_TEXT_SOURCES: ReadonlySet<BookSource> = new Set(['gutendex', 'standardebooks']);

/** An author who died less than this many years ago may still be protected by copyright somewhere. */
const COPYRIGHT_YEARS = 70;

export const SOURCE_LABELS: Record<BookSource, string> = {
  gutendex: 'Project Gutenberg',
  standardebooks: 'Standard Ebooks',
  openlibrary: 'Open Library',
  google: 'Google Books',
};

export function attributionFor(source: BookSource, readable: boolean): string {
  switch (source) {
    case 'gutendex':
      return readable ? 'Text from Project Gutenberg (public domain)' : 'Metadata from Project Gutenberg';
    case 'standardebooks':
      return readable ? 'Text from Standard Ebooks (public domain, CC0)' : 'Metadata from Standard Ebooks';
    case 'openlibrary':
      return 'Metadata from Open Library';
    case 'google':
      return 'Metadata from Google Books. Powered by Google';
  }
}

/**
 * The one place that decides whether a book may be read on Readora. Adapters say what their
 * source claims; this can only take readability away, never add it.
 * Run it on every book that leaves the service (search, details and content).
 */
export function applyReadabilityRules(book: Book, now = new Date()): Book {
  const diedRecently = book.authors.some(
    (author) => author.deathYear !== undefined && now.getFullYear() - author.deathYear < COPYRIGHT_YEARS,
  );
  const readable = book.readable && FULL_TEXT_SOURCES.has(book.source) && !diedRecently;

  return {
    ...book,
    readable,
    license: readable ? 'public-domain' : 'metadata-only',
    attribution: attributionFor(book.source, readable),
  };
}
