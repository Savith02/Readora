import type { ErrorRequestHandler, RequestHandler } from 'express';
import { logger } from '../utils/logger';

/** Throw this from a handler to send a specific status and message (plus optional extra fields) to the client. */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    /** Merged into the JSON body, e.g. { externalUrl } on a 403. */
    public readonly extra?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export const notFound: RequestHandler = (req, res) => {
  res.status(404).json({ success: false, message: `Not found: ${req.method} ${req.originalUrl}` });
};

interface MongoDuplicateKeyError {
  code: 11000;
  keyPattern?: Record<string, unknown>;
}

const isDuplicateKey = (err: unknown): err is MongoDuplicateKeyError =>
  typeof err === 'object' && err !== null && (err as { code?: unknown }).code === 11000;

// Express 5 forwards rejected promises from async handlers here, so handlers need no try/catch.
// The 4th parameter must stay: Express recognises error handlers by their arity.
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ success: false, message: err.message, ...err.extra });
    return;
  }
  if (isDuplicateKey(err)) {
    const field = Object.keys(err.keyPattern ?? {})[0];
    res.status(409).json({
      success: false,
      message: field === 'email' ? 'An account with this email already exists' : 'That value is already in use',
    });
    return;
  }
  if ((err as { type?: string }).type === 'entity.parse.failed') {
    res.status(400).json({ success: false, message: 'Malformed JSON in request body' });
    return;
  }

  logger.error(`Unhandled error: ${err instanceof Error ? (err.stack ?? err.message) : String(err)}`);
  res.status(500).json({ success: false, message: 'Something went wrong on our side. Please try again.' });
};
