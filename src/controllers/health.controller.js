const healthService = require('../services/health.service');
const AppError = require('../utils/AppError');
const { successResponse } = require('../utils/response');

class HealthController {
  async checkHealth(req, res, next) {
    try {
      const { isHealthy, healthData } = await healthService.getHealthStatus();

      if (!isHealthy) {
        throw new AppError(503, 'Service degraded: Database connection issue', healthData);
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
