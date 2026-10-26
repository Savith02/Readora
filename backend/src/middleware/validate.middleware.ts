import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';

/** Validates req.body against a Zod schema and replaces it with the parsed (trimmed, normalised) value. */
export const validate =
  (schema: ZodType): RequestHandler =>
  (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        message: 'Please fix the highlighted fields.',
        errors: result.error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message })),
      });
      return;
    }
    req.body = result.data;
    next();
  };
