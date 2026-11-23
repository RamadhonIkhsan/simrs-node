/**
 * Standard API response helper
 *
 * Success format:
 * {
 *   success: true,
 *   message: string,
 *   data: any,
 *   meta?: object
 * }
 *
 * Error format:
 * {
 *   success: false,
 *   message: string,
 *   errors?: array|object
 * }
 */

const successResponse = (res, { statusCode = 200, message = 'Success', data = null, meta = undefined }) => {
  const payload = {
    success: true,
    message,
    data,
  };

  if (meta !== undefined) {
    payload.meta = meta;
  }

  return res.status(statusCode).json(payload);
};

const errorResponse = (res, { statusCode = 500, message = 'Internal Server Error', errors = undefined }) => {
  const payload = {
    success: false,
    message,
  };

  if (errors !== undefined && errors !== null) {
    payload.errors = errors;
  }

  return res.status(statusCode).json(payload);
};

module.exports = {
  successResponse,
  errorResponse,
};
