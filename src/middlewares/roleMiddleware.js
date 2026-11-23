const AppError = require('../utils/AppError');

/**
 * RBAC authorization middleware to restrict access by user role.
 * Compares req.user.role_name case-insensitively.
 *
 * @param  {...string|string[]} roles - Allowed role names
 * @returns {import('express').RequestHandler}
 */
const authorizeRoles = (...roles) => {
  // Support both authorizeRoles('Admin', 'Dokter') and authorizeRoles(['Admin', 'Dokter'])
  const allowedRoles = roles.flat().map((role) => (typeof role === 'string' ? role.trim().toLowerCase() : role));

  return (req, _res, next) => {
    if (!req.user) {
      return next(new AppError(401, 'Unauthorized: Autentikasi diperlukan'));
    }

    const userRole = (req.user.role_name || '').trim().toLowerCase();

    if (!allowedRoles.includes(userRole)) {
      return next(new AppError(403, 'Forbidden: Anda tidak memiliki akses ke resource ini'));
    }

    return next();
  };
};

module.exports = {
  authorizeRoles,
};
