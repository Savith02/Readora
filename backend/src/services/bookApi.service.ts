import { BOOK_SOURCES } from '@readora/shared';
import type { Book, BookContent, BookSearchResult, BookSource, SourceStatus, SourceWarning } from '@readora/shared';
import { HttpError } from '../middleware/error.middleware';
import { HttpStatusError } from '../utils/http';
import { logger } from '../utils/logger';
import { authorKey, normalizeQuery, normalizeTitle } from '../utils/normalize';
import { BookNotFoundError, SourceUnavailableError } from './adapter.types';
import type { BookAdapter, SearchPage } from './adapter.types';
import { buildChapters } from './bookContent.service';
import { TTL, cached, memoryCached } from './cache.service';
import { googleBooksAdapter } from './googleBooks.adapter';
import { gutendexAdapter } from './gutendex.adapter';
import { openLibraryAdapter } from './openLibrary.adapter';
import { SOURCE_LABELS, applyReadabilityRules } from './readability';
import { standardEbooksAdapter } from './standardEbooks.adapter';

const ADAPTERS: Record<BookSource, BookAdapter> = {
  gutendex: gutendexAdapter,
  standardebooks: standardEbooksAdapter,
  openlibrary: openLibraryAdapter,
  google: googleBooksAdapter,
};

/**
 * Gutendex can take up to a minute on a search it has not seen before. Rather than make every
 * visitor wait for it, a search answers after this long with whatever has arrived; the slow
 * source keeps going in the background, fills the cache, and shows up on the next identical search.
 */
const SEARCH_SOFT_DEADLINE_MS = 10_000;

// Google data is only ever kept in memory (see cache.service), everything else goes to MongoDB.
const store = <T>(source: BookSource, key: string, ttlMs: number, load: () => Promise<T>): Promise<T> =>
  source === 'google' ? memoryCached(key, TTL.memory, load) : cached(key, ttlMs, load);

function describeFailure(source: BookSource, error: unknown): string {
  const label = SOURCE_LABELS[source];
  if (error instanceof SourceUnavailableError) return error.message;
  if (error instanceof HttpStatusError) return `${label} answered with an error (HTTP ${error.status})`;
  if (error instanceof Error && error.message.includes('did not answer')) return `${label} is too slow right now`;
  return `${label} could not be reached`;
}

function toHttpError(source: BookSource, error: unknown): HttpError {
  if (error instanceof HttpError) return error;
  if (error instanceof BookNotFoundError) return new HttpError(404, error.message);
  if (error instanceof SourceUnavailableError) return new HttpError(503, error.message);
  // Gutendex can take over 30 s to say that a book it has never been asked about does not exist.
  if (error instanceof Error && error.message.includes('did not answer')) {
    return new HttpError(504, `${SOURCE_LABELS[source]} is taking too long to answer. Please try again in a moment.`);
  }
  logger.warn(`${SOURCE_LABELS[source]} failed: ${error instanceof Error ? error.message : String(error)}`);
  return new HttpError(502, `${SOURCE_LABELS[source]} is not responding right now. Please try again in a moment.`);
}

function requireAdapter(source: BookSource): BookAdapter {
  const adapter = ADAPTERS[source];
  if (!adapter.enabled) throw new HttpError(404, `${SOURCE_LABELS[source]} is not available on this server`);
  return adapter;
}

async function waitUpTo(work: Promise<unknown>, ms: number): Promise<void> {
  let timer: NodeJS.Timeout | undefined;
  const deadline = new Promise<void>((resolve) => {
    timer = setTimeout(resolve, ms);
  });
  await Promise.race([work, deadline]);
  clearTimeout(timer);
}

/**
 * Readable books first, then one entry per book. Two entries are the same book when their
 * normalised title and the first author's surname match; the readable one (or, failing that,
 * the one from the higher-priority source) wins and borrows a missing cover or description.
 */
function combine(books: Book[]): Book[] {
  const ruled = books.map((book) => applyReadabilityRules(book));
  const ordered = [...ruled].sort((a, b) => Number(b.readable) - Number(a.readable)); // stable: keeps source order

  const unique = new Map<string, Book>();
  for (const book of ordered) {
    // Spaces are dropped from the title key so "Case-Book" and "Casebook", or "Moby-Dick" and "Moby Dick", match.
    const key = `${normalizeTitle(book.title).replaceAll(' ', '')}|${authorKey(book.authors[0]?.name)}`;
    const winner = unique.get(key);
    if (!winner) {
      unique.set(key, book);
      continue;
    }
    unique.set(key, {
      ...winner,
      coverUrl: winner.coverUrl ?? book.coverUrl,
      description: winner.description ?? book.description,
      subjects: [...new Set([...winner.subjects, ...book.subjects])].slice(0, 10),
    });
  }
  return [...unique.values()];
}

export interface SearchRequest {
  q: string;
  page: number;
  /** Ask a single source instead of all of them. */
  source?: BookSource;
}

export async function searchBooks({ q, page, source }: SearchRequest, softDeadlineMs = SEARCH_SOFT_DEADLINE_MS): Promise<BookSearchResult> {
  const requested: readonly BookSource[] = source ? [source] : BOOK_SOURCES;
  const query = normalizeQuery(q);

  const pages = new Map<BookSource, SearchPage>();
  const status: Partial<Record<BookSource, SourceStatus>> = {};
  const failures: SourceWarning[] = [];

  const tasks = requested.map(async (name) => {
    const adapter = ADAPTERS[name];
    if (!adapter.enabled) {
      status[name] = 'disabled';
      if (source) failures.push({ source: name, message: `${SOURCE_LABELS[name]} is not available on this server` });
      return;
    }
    status[name] = 'pending';
    try {
      pages.set(name, await store(name, `search:${name}:${page}:${query}`, TTL.search, () => adapter.search(q, page)));
      status[name] = 'ok';
    } catch (error) {
      status[name] = 'error';
      failures.push({ source: name, message: describeFailure(name, error) });
      if (!(error instanceof SourceUnavailableError)) logger.warn(`Search on ${SOURCE_LABELS[name]} failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  await waitUpTo(Promise.all(tasks), softDeadlineMs);

  // Freeze what has arrived. Sources still running keep going and will land in the cache.
  const arrived = new Map(pages);
  const sources = { ...status };
  const warnings = [...failures];
  for (const name of requested) {
    if (sources[name] === 'pending') {
      warnings.push({ source: name, message: `${SOURCE_LABELS[name]} is still loading. Search again in a few seconds to include it.` });
    }
  }

  const books = combine(BOOK_SOURCES.flatMap((name) => arrived.get(name)?.books ?? []));

  return {
    query: q,
    page,
    hasMore: [...arrived.values()].some((result) => result.hasMore),
    books,
    sources,
    warnings,
    attributions: [...new Set(books.map((book) => book.attribution))],
  };
}

export async function getBookDetails(source: BookSource, sourceId: string): Promise<Book> {
  const adapter = requireAdapter(source);
  try {
    const book = await store(source, `details:${source}:${sourceId}`, TTL.details, () => adapter.getDetails(sourceId));
    return applyReadabilityRules(book);
  } catch (error) {
    throw toHttpError(source, error);
  }
}

export async function getBookContent(source: BookSource, sourceId: string, chapter?: number): Promise<BookContent> {
  const book = await getBookDetails(source, sourceId);
  const adapter = ADAPTERS[source];

  if (!book.readable || !adapter.getContent) {
    throw new HttpError(403, 'This book is not available to read on Readora', { externalUrl: book.externalUrl });
  }

  const load = adapter.getContent.bind(adapter);
  let chapters;
  try {
    chapters = await store(source, `content:${source}:${sourceId}`, TTL.content, async () => buildChapters(await load(sourceId), book.title));
  } catch (error) {
    throw toHttpError(source, error);
  }

  const selected = chapter === undefined ? chapters : chapters.filter((item) => item.index === chapter);
  if (selected.length === 0) throw new HttpError(404, `This book has ${chapters.length} chapters (asked for chapter ${chapter})`);

  return {
    book,
    totalChapters: chapters.length,
    toc: chapters.map(({ index, title }) => ({ index, title })),
    chapters: selected,
    attribution: book.attribution,
  };
}
