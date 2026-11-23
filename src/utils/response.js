/**
 * Standard API response helper
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

const errorResponse = (res, { statusCode = 500, message = 'Internal Server Error', error = null }) => {
  const payload = {
    success: false,
    message,
  };
  if (error !== null && process.env.NODE_ENV !== 'production') {
    payload.error = error;
  }
  return res.status(statusCode).json(payload);
};

module.exports = {
  successResponse,
  errorResponse,
};
