import type { ApiSuccess } from '@readora/shared';
import type { RequestHandler } from 'express';
import { getBookContent, getBookDetails, searchBooks } from '../services/bookApi.service';
import type { BookParams, ContentQuery, SearchQuery } from '../validators/books.validators';

const ok = <T>(data: T): ApiSuccess<T> => ({ success: true, data });

// Input has already been validated and parsed by validateRequest (routes/books.routes.ts).

export const search: RequestHandler = async (_req, res) => {
  const { q, page, source } = res.locals.query as SearchQuery;
  res.json(ok(await searchBooks({ q, page, source })));
};

export const details: RequestHandler = async (_req, res) => {
  const { source, sourceId } = res.locals.params as BookParams;
  res.json(ok(await getBookDetails(source, sourceId)));
};

export const content: RequestHandler = async (_req, res) => {
  const { source, sourceId } = res.locals.params as BookParams;
  const { chapter } = res.locals.query as ContentQuery;
  res.json(ok(await getBookContent(source, sourceId, chapter)));
};
