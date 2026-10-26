import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';

const problem = (issue: { path: PropertyKey[]; message: string }) => ({
  field: issue.path.join('.'),
  message: issue.message,
});

/** Validates req.body against a Zod schema and replaces it with the parsed (trimmed, normalised) value. */
export const validate =
  (schema: ZodType): RequestHandler =>
  (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        success: false,
        message: 'Please fix the highlighted fields.',
        errors: result.error.issues.map(problem),
      });
      return;
    }
    req.body = result.data;
    next();
  };

interface RequestSchemas {
  query?: ZodType;
  params?: ZodType;
}

/**
 * Validates the query string and/or route params. Express 5 does not let a request's `query`
 * be replaced, so the parsed values are put on `res.locals.query` and `res.locals.params`.
 */
export const validateRequest =
  (schemas: RequestSchemas): RequestHandler =>
  (req, res, next) => {
    for (const part of ['params', 'query'] as const) {
      const schema = schemas[part];
      if (!schema) continue;

      const result = schema.safeParse(req[part]);
      if (!result.success) {
        res.status(400).json({
          success: false,
          message: result.error.issues[0]?.message ?? 'The request is not valid.',
          errors: result.error.issues.map(problem),
        });
        return;
      }
      res.locals[part] = result.data;
    }
    next();
  };
