import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { content, details, search } from '../controllers/books.controller';
import { validateRequest } from '../middleware/validate.middleware';
import { bookParamsSchema, contentQuerySchema, searchQuerySchema } from '../validators/books.validators';

const limiterOptions = { standardHeaders: 'draft-8', legacyHeaders: false } as const;

// These endpoints fan out to other people's servers, so they are limited per visitor.
const booksLimiter = rateLimit({
  ...limiterOptions,
  windowMs: 60_000,
  limit: 120,
  message: { success: false, message: 'Too many requests. Please slow down.' },
});

const searchLimiter = rateLimit({
  ...limiterOptions,
  windowMs: 60_000,
  limit: 30,
  message: { success: false, message: 'Too many searches. Please wait a moment.' },
});

export const booksRouter = Router();

booksRouter.use(booksLimiter);

// "search" is declared first so it is never read as a :source.
booksRouter.get('/search', searchLimiter, validateRequest({ query: searchQuerySchema }), search);
booksRouter.get('/:source/:sourceId', validateRequest({ params: bookParamsSchema }), details);
booksRouter.get('/:source/:sourceId/content', validateRequest({ params: bookParamsSchema, query: contentQuerySchema }), content);
