const { query } = require('../config/db');

/**
 * Health check repository to perform lightweight database ping
 */
class HealthRepository {
  async pingDatabase() {
    const start = Date.now();
    const result = await query('SELECT 1 AS status;');
    const latency = Date.now() - start;

    return {
      connected: result.rows.length > 0 && result.rows[0].status === 1,
      latencyMs: latency,
    };
  }
}

module.exports = new HealthRepository();
