const healthService = require('../services/health.service');
const AppError = require('../utils/AppError');
const { successResponse } = require('../utils/response');

class HealthController {
  async checkHealth(req, res, next) {
    try {
      const { isHealthy, healthData } = await healthService.getHealthStatus();

      if (!isHealthy) {
        throw new AppError(503, 'Koneksi database bermasalah', healthData);
      }

      return successResponse(res, {
        statusCode: 200,
        message: 'Berhasil',
        data: healthData,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new HealthController();
