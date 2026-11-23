const { Pool } = require('pg');
const env = require('./env');

const pool = new Pool({
  host: env.db.host,
  port: env.db.port,
  database: env.db.database,
  user: env.db.user,
  password: env.db.password,
  max: env.db.max,
  idleTimeoutMillis: env.db.idleTimeoutMillis,
  connectionTimeoutMillis: env.db.connectionTimeoutMillis,
});

pool.on('error', (err) => {
  console.error('[PostgreSQL] Unexpected error on idle client:', err.message);
});

/**
 * Execute a query with parameters
 * @param {string} text
 * @param {Array} [params]
 * @returns {Promise<import('pg').QueryResult>}
 */
const query = async (text, params) => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (env.NODE_ENV === 'development') {
    console.debug(`[PostgreSQL] Query executed in ${duration}ms: ${text.slice(0, 100)}`);
  }
  return res;
};

/**
 * Close PostgreSQL pool for graceful shutdown
 * @returns {Promise<void>}
 */
const closePool = async () => {
  try {
    await pool.end();
    console.log('[PostgreSQL] Connection pool has been closed gracefully.');
  } catch (err) {
    console.error('[PostgreSQL] Error closing connection pool:', err.message);
    throw err;
  }
};

module.exports = {
  pool,
  query,
  closePool,
};
