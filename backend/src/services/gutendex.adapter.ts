import type { Book } from '@readora/shared';
import { HttpStatusError, getJson, getText } from '../utils/http';
import { cleanCatalogTitle, toDisplayName } from '../utils/normalize';
import { attributionFor } from './readability';
import { BookNotFoundError } from './adapter.types';
import type { BookAdapter, RawContent, SearchPage } from './adapter.types';

// The trailing slash matters: without it Gutendex answers with a redirect.
const BASE = 'https://gutendex.com/books/';

// Gutendex is slow on searches it has not seen before (15-50 s), but fast when looking up one id.
const LIST_TIMEOUT_MS = 90_000;
// Even "no such book" can take Gutendex ~15 s, so single lookups get a generous limit too.
const DETAIL_TIMEOUT_MS = 30_000;
const CONTENT_TIMEOUT_MS = 30_000;

interface GutendexAuthor {
  name: string;
  birth_year: number | null;
  death_year: number | null;
}

interface GutendexBook {
  id: number;
  title: string;
  authors: GutendexAuthor[];
  languages: string[];
  subjects: string[];
  /** false = public domain in the US. null = unknown. */
  copyright: boolean | null;
  formats: Record<string, string>;
}

interface GutendexList {
  next: string | null;
  results: GutendexBook[];
}

/** Book text is only ever fetched from Project Gutenberg itself, whatever URL the API hands back. */
function assertGutenbergUrl(url: string): string {
  const { protocol, hostname } = new URL(url);
  if (protocol !== 'https:' || (hostname !== 'gutenberg.org' && !hostname.endsWith('.gutenberg.org'))) {
    throw new BookNotFoundError('This book has no readable text format');
  }
  return url;
}

/** First format whose type starts with `prefix`, skipping zip archives. */
const findFormat = (formats: Record<string, string>, prefix: string): string | undefined =>
  Object.entries(formats).find(([type, url]) => type.startsWith(prefix) && !url.endsWith('.zip'))?.[1];

const htmlUrl = (formats: Record<string, string>) => findFormat(formats, 'text/html');
const textUrl = (formats: Record<string, string>) => formats['text/plain; charset=utf-8'] ?? findFormat(formats, 'text/plain');

function toBook(raw: GutendexBook): Book {
  // Readable only when Gutendex says public domain AND there is HTML or plain text to serve.
  const readable = raw.copyright === false && Boolean(htmlUrl(raw.formats) ?? textUrl(raw.formats));
  return {
    id: `gutendex:${raw.id}`,
    source: 'gutendex',
    sourceId: String(raw.id),
    title: cleanCatalogTitle(raw.title),
    authors: raw.authors.map((author) => ({
      name: toDisplayName(author.name),
      ...(author.birth_year != null && { birthYear: author.birth_year }),
      ...(author.death_year != null && { deathYear: author.death_year }),
    })),
    ...(raw.formats['image/jpeg'] && { coverUrl: raw.formats['image/jpeg'] }),
    languages: raw.languages,
    subjects: raw.subjects.slice(0, 10),
    readable,
    license: readable ? 'public-domain' : 'metadata-only',
    externalUrl: `https://www.gutenberg.org/ebooks/${raw.id}`,
    attribution: attributionFor('gutendex', readable),
  };
}

export const gutendexAdapter: BookAdapter = {
  source: 'gutendex',
  enabled: true,

  async search(query, page): Promise<SearchPage> {
    const params = new URLSearchParams({ search: query, copyright: 'false' });
    if (page > 1) params.set('page', String(page));
    const list = await getJson<GutendexList>(`${BASE}?${params}`, { timeoutMs: LIST_TIMEOUT_MS });
    return { books: list.results.map(toBook), hasMore: list.next !== null };
  },

  async getDetails(sourceId): Promise<Book> {
    try {
      return toBook(await getJson<GutendexBook>(`${BASE}${sourceId}/`, { timeoutMs: DETAIL_TIMEOUT_MS }));
    } catch (error) {
      if (error instanceof HttpStatusError && error.status === 404) throw new BookNotFoundError();
      throw error;
    }
  },

  async getContent(sourceId): Promise<RawContent> {
    const raw = await getJson<GutendexBook>(`${BASE}${sourceId}/`, { timeoutMs: DETAIL_TIMEOUT_MS });
    const html = htmlUrl(raw.formats);
    const text = textUrl(raw.formats);
    if (!html && !text) throw new BookNotFoundError('This book has no readable text format');

    // These URLs redirect to the real file; the fetch helper follows redirects.
    if (html) return { kind: 'html', body: await getText(assertGutenbergUrl(html), { timeoutMs: CONTENT_TIMEOUT_MS }), gutenberg: true };
    return { kind: 'text', body: await getText(assertGutenbergUrl(text as string), { timeoutMs: CONTENT_TIMEOUT_MS }), gutenberg: true };
  },
};
