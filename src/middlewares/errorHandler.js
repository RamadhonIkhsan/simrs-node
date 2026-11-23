const { ZodError } = require('zod');
const AppError = require('../utils/AppError');
const { errorResponse } = require('../utils/response');

/**
 * Maps known PostgreSQL error codes to standard HTTP status codes and messages
 */
const handlePostgreSQLError = (err) => {
  switch (err.code) {
    case '23505': // unique_violation
      return {
        statusCode: 409,
        message: 'Duplicate entry detected',
        errors: err.detail ? [{ detail: err.detail }] : undefined,
      };
    case '23503': // foreign_key_violation
      return {
        statusCode: 400,
        message: 'Foreign key constraint violation: referenced resource does not exist',
        errors: err.detail ? [{ detail: err.detail }] : undefined,
      };
    case '23502': // not_null_violation
      return {
        statusCode: 400,
        message: `Missing required field: ${err.column || 'unknown'}`,
      };
    case '22P02': // invalid_text_representation (e.g. invalid syntax for integer/uuid)
      return {
        statusCode: 400,
        message: 'Invalid input syntax for database type',
      };
    case '08001':
    case '08006':
    case '57P01':
    case 'ECONNREFUSED':
    case 'ETIMEDOUT':
      return {
        statusCode: 503,
        message: 'Database service is currently unavailable',
      };
    default:
      return null;
  }
};

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, _next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors !== undefined ? err.errors : null;

  // 1. AppError (Custom operational application error)
  if (err instanceof AppError || err.name === 'AppError') {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
  }
  // 2. Zod Validation Error
  else if (err instanceof ZodError || err.name === 'ZodError') {
    statusCode = 422;
    message = 'Validation error';
    errors = err.issues.map((issue) => {
      // Normalize field path, stripping outer wrapper if present (e.g. "body.name" -> "name")
      let fieldPath = issue.path.join('.');
      if (fieldPath.startsWith('body.') || fieldPath.startsWith('query.') || fieldPath.startsWith('params.')) {
        fieldPath = fieldPath.split('.').slice(1).join('.');
      }
      return {
        field: fieldPath || 'root',
        message: issue.message,
      };
    });
  }
  // 3. JWT Errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token has expired';
  }
  // 4. PostgreSQL Errors
  else if (err.code) {
    const pgError = handlePostgreSQLError(err);
    if (pgError) {
      statusCode = pgError.statusCode;
      message = pgError.message;
      errors = pgError.errors;
    }
  }

  // Log error based on severity
  if (statusCode >= 500) {
    console.error(`[Server Error 500] ${req.method} ${req.originalUrl}:`, err);
  } else if (process.env.NODE_ENV === 'development') {
    console.warn(`[Client Error ${statusCode}] ${req.method} ${req.originalUrl}: ${message}`);
  }

  // Fallback in production: do not leak unexpected internal errors or stack traces
  if (statusCode === 500 && process.env.NODE_ENV === 'production') {
    message = 'Internal Server Error';
    errors = null;
  } else if (statusCode === 500 && process.env.NODE_ENV !== 'production' && !errors) {
    errors = {
      stack: err.stack,
    };
  }

  return errorResponse(res, {
    statusCode,
    message,
    errors,
  });
};

module.exports = errorHandler;
