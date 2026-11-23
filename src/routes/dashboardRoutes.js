const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');
const validateRequest = require('../middlewares/validateRequest');
const { dashboardQuerySchema } = require('../validators/dashboardValidator');
const { ROLES } = require('../utils/roles');

const router = express.Router();

/**
 * @route GET /api/dashboard/summary
 * @desc Get aggregated dashboard summary metrics
 * @access Private (Administrator and authorized management roles)
 */
router.get(
  '/summary',
  authMiddleware,
  authorizeRoles(ROLES.ADMINISTRATOR),
  validateRequest({ query: dashboardQuerySchema }),
  (req, res, next) => dashboardController.getSummary(req, res, next)
);

module.exports = router;
