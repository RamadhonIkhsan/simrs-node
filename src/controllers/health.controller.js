const healthService = require('../services/health.service');
const { successResponse, errorResponse } = require('../utils/response');

class HealthController {
  async checkHealth(req, res, next) {
    try {
      const { isHealthy, healthData } = await healthService.getHealthStatus();

      if (!isHealthy) {
        return res.status(503).json({
          success: false,
          message: 'Service degraded: Database connection issue',
          data: healthData,
        });
      }

      return successResponse(res, {
        statusCode: 200,
        message: 'SIMRS Node Service is healthy',
        data: healthData,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new HealthController();
