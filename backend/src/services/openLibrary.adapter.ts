import type { Book, BookAuthor } from '@readora/shared';
import { HttpStatusError, getJson } from '../utils/http';
import { normalizeLanguage, parseYear } from '../utils/normalize';
import { attributionFor } from './readability';
import { BookNotFoundError } from './adapter.types';
import type { BookAdapter, SearchPage } from './adapter.types';

const SITE = 'https://openlibrary.org';
const PAGE_SIZE = 20;
const TIMEOUT_MS = 15_000; // Open Library answers in about 3 s, but not always.

interface SearchDoc {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
  language?: string[];
  subject?: string[];
}

interface SearchResponse {
  numFound: number;
  start: number;
  docs: SearchDoc[];
}

interface WorkResponse {
  title: string;
  description?: string | { value: string };
  subjects?: string[];
  covers?: number[];
  authors?: Array<{ author?: { key: string } }>;
}

interface AuthorResponse {
  name?: string;
  birth_date?: string;
  death_date?: string;
}

const coverUrl = (id: number | undefined) => (id && id > 0 ? `https://covers.openlibrary.org/b/id/${id}-M.jpg` : undefined);

/** Metadata only: Open Library is never a source of full text, whatever the book's license. */
function metadataBook(fields: { workKey: string; title: string; authors: BookAuthor[]; cover?: string; languages: string[]; subjects: string[]; description?: string }): Book {
  const sourceId = fields.workKey.replace('/works/', '');
  return {
    id: `openlibrary:${sourceId}`,
    source: 'openlibrary',
    sourceId,
    title: fields.title,
    authors: fields.authors,
    ...(fields.cover && { coverUrl: fields.cover }),
    languages: fields.languages,
    subjects: fields.subjects,
    readable: false,
    license: 'metadata-only',
    // The Open Library page is where a reader can borrow the book.
    externalUrl: `${SITE}${fields.workKey}`,
    attribution: attributionFor('openlibrary', false),
    ...(fields.description && { description: fields.description }),
  };
}

export const openLibraryAdapter: BookAdapter = {
  source: 'openlibrary',
  enabled: true,

  async search(query, page): Promise<SearchPage> {
    const params = new URLSearchParams({
      q: query,
      page: String(page),
      limit: String(PAGE_SIZE),
      fields: 'key,title,author_name,cover_i,language,subject',
    });
    const result = await getJson<SearchResponse>(`${SITE}/search.json?${params}`, { timeoutMs: TIMEOUT_MS });

    const books = result.docs.map((doc) =>
      metadataBook({
        workKey: doc.key,
        title: doc.title,
        authors: (doc.author_name ?? []).map((name) => ({ name })),
        cover: coverUrl(doc.cover_i),
        languages: [...new Set((doc.language ?? []).map(normalizeLanguage))],
        subjects: (doc.subject ?? []).slice(0, 10),
      }),
    );
    return { books, hasMore: result.start + result.docs.length < result.numFound };
  },

  async getDetails(sourceId): Promise<Book> {
    let work: WorkResponse;
    try {
      work = await getJson<WorkResponse>(`${SITE}/works/${sourceId}.json`, { timeoutMs: TIMEOUT_MS });
    } catch (error) {
      if (error instanceof HttpStatusError && error.status === 404) throw new BookNotFoundError();
      throw error;
    }

    // One extra request per author (at most 3), for names and birth/death years.
    // Only well-formed author keys are followed, so an odd value in the response can't redirect the request elsewhere.
    const authorKeys = (work.authors ?? []).map((entry) => entry.author?.key).filter((key): key is string => /^\/authors\/OL\d+A$/.test(key ?? ''));
    const authors = (
      await Promise.allSettled(authorKeys.slice(0, 3).map((key) => getJson<AuthorResponse>(`${SITE}${key}.json`, { timeoutMs: TIMEOUT_MS })))
    ).flatMap((result): BookAuthor[] => {
      if (result.status !== 'fulfilled' || !result.value.name) return [];
      const birthYear = parseYear(result.value.birth_date);
      const deathYear = parseYear(result.value.death_date);
      return [{ name: result.value.name, ...(birthYear !== undefined && { birthYear }), ...(deathYear !== undefined && { deathYear }) }];
    });

    const description = typeof work.description === 'string' ? work.description : work.description?.value;
    return metadataBook({
      workKey: `/works/${sourceId}`,
      title: work.title,
      authors,
      cover: coverUrl(work.covers?.find((id) => id > 0)),
      languages: [],
      subjects: (work.subjects ?? []).slice(0, 10),
      description: description?.trim() || undefined,
    });
  },
};
