const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 3001,

  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    database: process.env.DB_NAME || 'simrs',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    max: parseInt(process.env.DB_POOL_MAX, 10) || 20,
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT_MILLIS, 10) || 30000,
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT_MILLIS, 10) || 5000,
  },

  jwt: {
    secret: process.env.JWT_SECRET || '',
    algorithm: process.env.JWT_ALGORITHM || 'HS256',
  },

  internal: {
    yiiBaseUrl: process.env.YII_BASE_URL || 'http://127.0.0.1:8080',
    serviceKey: process.env.INTERNAL_SERVICE_KEY || '',
  },
};

module.exports = env;
