const jwt = require('jsonwebtoken');
const env = require('../config/env');
const AppError = require('../utils/AppError');

/**
 * JWT Authentication Middleware
 * Validates HS256 JWT tokens issued by Yii2 backend.
 */
const authMiddleware = (req, _res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError(401, 'Unauthorized: Token tidak ditemukan'));
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || !parts[1].trim()) {
    return next(new AppError(401, 'Unauthorized: Token tidak ditemukan'));
  }

  const token = parts[1].trim();

  try {
    const secret = env.jwt.secret || process.env.JWT_SECRET;
    const algorithm = env.jwt.algorithm || process.env.JWT_ALGORITHM || 'HS256';

    const decoded = jwt.verify(token, secret, {
      algorithms: [algorithm],
    });

    // Populate req.user according to Yii2 JWT payload schema
    req.user = {
      id: decoded.uid,
      username: decoded.username,
      role_id: decoded.role_id,
      role_name: decoded.role_name,
    };

    return next();
  } catch (err) {
    return next(err);
  }
};

module.exports = authMiddleware;
