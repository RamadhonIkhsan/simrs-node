/**
 * Custom application error class for operational errors
 */
class AppError extends Error {
  /**
   * @param {number} statusCode - HTTP status code (e.g. 400, 401, 403, 404, 422, 500)
   * @param {string} message - Human readable error message
   * @param {Array|Object|null} [errors=null] - Detailed error payload or validation issues
   * @param {boolean} [isOperational=true] - Distinguishes operational errors from programming bugs
   */
  constructor(statusCode, message, errors = null, isOperational = true) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.errors = errors;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
