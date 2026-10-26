import type { Book } from '@readora/shared';
import { env } from '../config/env';
import { HttpStatusError, getJson } from '../utils/http';
import { normalizeLanguage } from '../utils/normalize';
import { attributionFor } from './readability';
import { BookNotFoundError } from './adapter.types';
import type { BookAdapter, SearchPage } from './adapter.types';

const API = 'https://www.googleapis.com/books/v1/volumes';
const PAGE_SIZE = 20;
const TIMEOUT_MS = 15_000;

interface Volume {
  id: string;
  volumeInfo: {
    title: string;
    subtitle?: string;
    authors?: string[];
    description?: string;
    language?: string;
    categories?: string[];
    imageLinks?: { thumbnail?: string; smallThumbnail?: string };
    infoLink?: string;
  };
  saleInfo?: { buyLink?: string };
}

interface VolumesResponse {
  totalItems: number;
  items?: Volume[];
}

/** Metadata only. This data is never written to the database (see TTL.memory in cache.service). */
function toBook(volume: Volume): Book {
  const info = volume.volumeInfo;
  const thumbnail = (info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail)?.replace(/^http:/, 'https:').replace('&edge=curl', '');
  const externalUrl = volume.saleInfo?.buyLink ?? info.infoLink;
  return {
    id: `google:${volume.id}`,
    source: 'google',
    sourceId: volume.id,
    title: info.subtitle ? `${info.title}: ${info.subtitle}` : info.title,
    authors: (info.authors ?? []).map((name) => ({ name })),
    ...(thumbnail && { coverUrl: thumbnail }),
    languages: info.language ? [normalizeLanguage(info.language)] : [],
    subjects: (info.categories ?? []).slice(0, 10),
    readable: false,
    license: 'metadata-only',
    ...(externalUrl && { externalUrl }),
    attribution: attributionFor('google', false),
    ...(info.description && { description: info.description }),
  };
}

/** The key goes in the query string, so this URL must never be logged (http.ts logs origin + path only). */
const withKey = (params: URLSearchParams): string => {
  params.set('key', env.GOOGLE_BOOKS_API_KEY ?? '');
  return params.toString();
};

export const googleBooksAdapter: BookAdapter = {
  source: 'google',
  // Without a key Google refuses requests (HTTP 429), so the source stays off.
  enabled: Boolean(env.GOOGLE_BOOKS_API_KEY),

  async search(query, page): Promise<SearchPage> {
    const startIndex = (page - 1) * PAGE_SIZE;
    const params = new URLSearchParams({ q: query, startIndex: String(startIndex), maxResults: String(PAGE_SIZE), printType: 'books' });
    const result = await getJson<VolumesResponse>(`${API}?${withKey(params)}`, { timeoutMs: TIMEOUT_MS });
    const items = result.items ?? [];
    return { books: items.map(toBook), hasMore: startIndex + items.length < result.totalItems };
  },

  async getDetails(sourceId): Promise<Book> {
    try {
      return toBook(await getJson<Volume>(`${API}/${encodeURIComponent(sourceId)}?${withKey(new URLSearchParams())}`, { timeoutMs: TIMEOUT_MS }));
    } catch (error) {
      if (error instanceof HttpStatusError && error.status === 404) throw new BookNotFoundError();
      throw error;
    }
  },
};
