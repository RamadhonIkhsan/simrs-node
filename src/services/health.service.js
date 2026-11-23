const healthRepository = require('../repositories/health.repository');

class HealthService {
  async getHealthStatus() {
    let dbStatus;

    try {
      const pingResult = await healthRepository.pingDatabase();
      dbStatus = {
        status: pingResult.connected ? 'healthy' : 'unhealthy',
        latencyMs: pingResult.latencyMs,
      };
    } catch (err) {
      dbStatus = {
        status: 'unhealthy',
        error: err.message,
      };
    }

    const isHealthy = dbStatus.status === 'healthy';

    const healthData = {
      server: {
        status: 'healthy',
        uptime: `${Math.floor(process.uptime())}s`,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
      },
      database: dbStatus,
    };

    return {
      isHealthy,
      healthData,
    };
  }
}

module.exports = new HealthService();
