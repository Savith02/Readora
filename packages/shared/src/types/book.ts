/** Where a book's data comes from. Only `gutendex` and `standardebooks` can provide full text. */
export const BOOK_SOURCES = ['gutendex', 'standardebooks', 'openlibrary', 'google'] as const;
export type BookSource = (typeof BOOK_SOURCES)[number];

export interface BookAuthor {
  name: string;
  birthYear?: number;
  deathYear?: number;
}

/** `public-domain` books can be read on Readora; `metadata-only` books link out instead. */
export type BookLicense = 'public-domain' | 'metadata-only';

export interface Book {
  /** `${source}:${sourceId}` */
  id: string;
  source: BookSource;
  /** The id inside the source. For Standard Ebooks, "author~title" (the "/" of its path becomes "~"). */
  sourceId: string;
  title: string;
  authors: BookAuthor[];
  coverUrl?: string;
  languages: string[];
  subjects: string[];
  /** True only for public-domain books whose full text Readora is allowed to serve. */
  readable: boolean;
  license: BookLicense;
  /** Where to borrow or buy the book (metadata-only books) or see it at its source. */
  externalUrl?: string;
  /** Credit line that has to be shown with this book, e.g. "Metadata from Open Library". */
  attribution: string;
  /** Only present on the details endpoint. */
  description?: string;
}

/** A source that could not answer in time or at all. The other sources' results are still returned. */
export interface SourceWarning {
  source: BookSource;
  message: string;
}

export type SourceStatus = 'ok' | 'pending' | 'error' | 'disabled';

export interface BookSearchResult {
  query: string;
  page: number;
  /** True when at least one source has more results on the next page. */
  hasMore: boolean;
  /** Readable books first. */
  books: Book[];
  /** What happened with each source that was asked. */
  sources: Partial<Record<BookSource, SourceStatus>>;
  warnings: SourceWarning[];
  /** Every credit line that applies to this response. */
  attributions: string[];
}

export interface BookChapter {
  /** 1-based. */
  index: number;
  title: string;
  /** Sanitised HTML, safe to inject into the page. */
  html: string;
}

export interface BookTocEntry {
  index: number;
  title: string;
}

export interface BookContent {
  book: Book;
  totalChapters: number;
  toc: BookTocEntry[];
  /** All chapters, or just the one asked for with ?chapter=N. */
  chapters: BookChapter[];
  attribution: string;
}

/** The envelope every successful books response uses. */
export interface ApiSuccess<T> {
  success: true;
  data: T;
}
