import * as cheerio from 'cheerio';
import type { Book } from '@readora/shared';
import { logger } from '../utils/logger';
import { HttpStatusError, getText } from '../utils/http';
import { normalizeLanguage } from '../utils/normalize';
import { attributionFor } from './readability';
import { BookNotFoundError, SourceUnavailableError } from './adapter.types';
import type { BookAdapter, RawContent, SearchPage } from './adapter.types';

const SITE = 'https://standardebooks.org';
const SEARCH_FEED = `${SITE}/feeds/opds/all`;
const TIMEOUT_MS = 15_000;
const CONTENT_TIMEOUT_MS = 30_000;

// If the feed starts asking for a login, stop calling it for a while instead of failing every search.
const RETRY_AFTER_MS = 60 * 60 * 1000;
let unavailableUntil = 0;

/** "/ebooks/arthur-conan-doyle/the-casebook" -> "arthur-conan-doyle~the-casebook". Slashes cannot sit in a route param. */
const toSourceId = (url: string): string =>
  new URL(url).pathname.replace(/^\/ebooks\//, '').replace(/\/$/, '').replaceAll('/', '~');

/** The reverse. The id is validated against [a-z0-9~-] before it gets here. */
const toPath = (sourceId: string): string => sourceId.replaceAll('~', '/');

const readableBook = (fields: Omit<Book, 'id' | 'source' | 'readable' | 'license' | 'attribution'> & { sourceId: string }): Book => ({
  ...fields,
  id: `standardebooks:${fields.sourceId}`,
  source: 'standardebooks',
  readable: true,
  license: 'public-domain',
  attribution: attributionFor('standardebooks', true),
});

function parseFeed(xml: string): SearchPage {
  const $ = cheerio.load(xml, { xmlMode: true });

  const books = $('feed > entry')
    .toArray()
    .map((node) => {
      const entry = $(node);
      const id = entry.children('id').first().text().trim();
      const coverUrl = entry.children('link[rel="http://opds-spec.org/image"]').attr('href');

      const subjects = entry
        .children('category')
        .toArray()
        .map((category) => ({ scheme: $(category).attr('scheme') ?? '', term: $(category).attr('term') ?? '' }))
        .filter((c) => c.term)
        // Standard Ebooks' own short subjects ("Fiction", "Mystery") first, then the long Library of Congress ones.
        .sort((a, b) => Number(b.scheme.includes('standardebooks')) - Number(a.scheme.includes('standardebooks')))
        .map((c) => c.term)
        .slice(0, 10);

      return readableBook({
        sourceId: toSourceId(id),
        title: entry.children('title').first().text().trim(),
        authors: entry
          .children('author')
          .toArray()
          .map((author) => ({ name: $(author).children('name').first().text().trim() }))
          .filter((author) => author.name),
        ...(coverUrl && { coverUrl }),
        languages: [normalizeLanguage(entry.children('dc\\:language').first().text().trim() || 'en')],
        subjects,
        externalUrl: id,
        description: entry.children('summary').first().text().trim() || undefined,
      });
    });

  return { books, hasMore: $('feed > link[rel="next"]').length > 0 };
}

export const standardEbooksAdapter: BookAdapter = {
  source: 'standardebooks',
  enabled: true,

  async search(query, page): Promise<SearchPage> {
    if (Date.now() < unavailableUntil) throw new SourceUnavailableError('Standard Ebooks is not available right now');

    try {
      const params = new URLSearchParams({ query, page: String(page) });
      return parseFeed(await getText(`${SEARCH_FEED}?${params}`, { timeoutMs: TIMEOUT_MS }));
    } catch (error) {
      // The browse feeds need a Standard Ebooks login; the search feed does not, but that could change.
      if (error instanceof HttpStatusError && (error.status === 401 || error.status === 403)) {
        unavailableUntil = Date.now() + RETRY_AFTER_MS;
        logger.warn('Standard Ebooks feed asked for authentication; skipping this source for an hour');
        throw new SourceUnavailableError('Standard Ebooks needs authentication, so it was skipped');
      }
      throw error;
    }
  },

  async getDetails(sourceId): Promise<Book> {
    let page: string;
    try {
      page = await getText(`${SITE}/ebooks/${toPath(sourceId)}`, { timeoutMs: TIMEOUT_MS });
    } catch (error) {
      if (error instanceof HttpStatusError && error.status === 404) throw new BookNotFoundError();
      throw error;
    }

    const $ = cheerio.load(page);
    const title = $('h1[property="schema:name"]').first().text().trim();
    if (!title) throw new BookNotFoundError();

    const coverUrl = $('meta[property="og:image"]').attr('content');
    const language = $('meta[property="schema:inLanguage"]').attr('content');
    const description = $('div[property="schema:description"]').first().text().replace(/\s+/g, ' ').trim();

    return readableBook({
      sourceId,
      title,
      authors: $('a[property="schema:author"] [property="schema:name"]')
        .toArray()
        .map((node) => ({ name: $(node).text().trim() }))
        .filter((author) => author.name),
      ...(coverUrl && { coverUrl }),
      languages: [normalizeLanguage(language ?? 'en')],
      subjects: [],
      externalUrl: `${SITE}/ebooks/${toPath(sourceId)}`,
      description: description || undefined,
    });
  },

  async getContent(sourceId): Promise<RawContent> {
    try {
      const body = await getText(`${SITE}/ebooks/${toPath(sourceId)}/text/single-page`, { timeoutMs: CONTENT_TIMEOUT_MS });
      return { kind: 'html', body, standardEbooks: true };
    } catch (error) {
      if (error instanceof HttpStatusError && error.status === 404) throw new BookNotFoundError();
      throw error;
    }
  },
};
