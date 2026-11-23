/**
 * Reusable request validation middleware using Zod.
 * Validates req.body, req.query, and/or req.params.
 *
 * @param {object|import('zod').ZodTypeAny} schema
 * @returns {import('express').RequestHandler}
 */
const setProperty = (target, prop, value) => {
  Object.defineProperty(target, prop, {
    value,
    writable: true,
    configurable: true,
    enumerable: true,
  });
};

const validateRequest = (schema) => async (req, _res, next) => {
  try {
    req.validated = req.validated || {};

    // Pattern 2: Direct Zod Schema (e.g. z.object({ body, query, params }))
    if (typeof schema.parseAsync === 'function') {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      if (parsed.body !== undefined) {
        setProperty(req, 'body', parsed.body);
        req.validated.body = parsed.body;
      }
      if (parsed.query !== undefined) {
        setProperty(req, 'query', parsed.query);
        req.validated.query = parsed.query;
      }
      if (parsed.params !== undefined) {
        setProperty(req, 'params', parsed.params);
        req.validated.params = parsed.params;
      }

      return next();
    }

    // Pattern 1: Object container { body, query, params }
    if (schema.params) {
      const parsedParams = await schema.params.parseAsync(req.params);
      setProperty(req, 'params', parsedParams);
      req.validated.params = parsedParams;
    }

    if (schema.query) {
      const parsedQuery = await schema.query.parseAsync(req.query);
      setProperty(req, 'query', parsedQuery);
      req.validated.query = parsedQuery;
    }

    if (schema.body) {
      const parsedBody = await schema.body.parseAsync(req.body);
      setProperty(req, 'body', parsedBody);
      req.validated.body = parsedBody;
    }

    return next();
  } catch (err) {
    return next(err);
  }
};

module.exports = validateRequest;
