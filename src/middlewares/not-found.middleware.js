const { errorResponse } = require('../utils/response');

const notFoundHandler = (req, res, _next) => {
  return errorResponse(res, {
    statusCode: 404,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

module.exports = notFoundHandler;
