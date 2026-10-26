import type { Book, BookSource } from '@readora/shared';

export interface SearchPage {
  books: Book[];
  /** True when the source has more results on the next page. */
  hasMore: boolean;
}

/** Full text as the source delivers it, before it is cleaned and split into chapters. */
export interface RawContent {
  kind: 'html' | 'text';
  body: string;
  /** Project Gutenberg files carry a license block that has to be removed. */
  gutenberg?: boolean;
  /** Standard Ebooks files carry a title page, colophon and license pages that are removed. */
  standardEbooks?: boolean;
}

/** One book source. Adapters only fetch and map; caching and combining happen in bookApi.service. */
export interface BookAdapter {
  source: BookSource;
  /** False when the source needs configuration that is missing (Google Books without a key). */
  enabled: boolean;
  search(query: string, page: number): Promise<SearchPage>;
  getDetails(sourceId: string): Promise<Book>;
  /** Only sources that may serve full text implement this. */
  getContent?(sourceId: string): Promise<RawContent>;
}

/** The source has no such book. */
export class BookNotFoundError extends Error {
  constructor(message = 'Book not found') {
    super(message);
    this.name = 'BookNotFoundError';
  }
}

/** The source cannot be used right now for a known reason, e.g. it asks for a login. */
export class SourceUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SourceUnavailableError';
  }
}
