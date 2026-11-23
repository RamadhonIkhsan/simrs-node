/**
 * Standard API response helper
 *
 * Success format:
 * {
 *   rc: number,        // e.g. 200
 *   rm: string,        // e.g. 'Berhasil'
 *   data: any,
 *   meta?: object
 * }
 *
 * Error format:
 * {
 *   rc: number,        // e.g. 400, 401, 403, 404, 422, 500
 *   rm: string,        // e.g. 'Pesan error'
 *   errors?: array|object
 * }
 */

const successResponse = (res, { statusCode = 200, message = 'Berhasil', data = null, meta = undefined }) => {
  const payload = {
    rc: statusCode,
    rm: message,
    data,
  };

  if (meta !== undefined) {
    payload.meta = meta;
  }

  return res.status(statusCode).json(payload);
};

const errorResponse = (res, { statusCode = 500, message = 'Terjadi kesalahan pada server', errors = undefined }) => {
  const payload = {
    rc: statusCode,
    rm: message,
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
