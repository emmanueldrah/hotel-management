import { NextFunction, Request, Response } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { ApiError } from '../utils/ApiError';

/**
 * Validates and coerces req.body / req.query / req.params against a Zod schema
 * shaped as `{ body?, query?, params? }`. On success the parsed values replace
 * the originals so downstream handlers get typed, sanitized input.
 */
export function validate(schema: AnyZodObject) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      if (parsed.body) req.body = parsed.body;
      if (parsed.query) Object.assign(req.query, parsed.query);
      if (parsed.params) Object.assign(req.params, parsed.params);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        throw ApiError.badRequest('Validation failed', err.flatten().fieldErrors);
      }
      throw err;
    }
  };
}
