const app = require('./app');
const env = require('./config/env');
const { closePool } = require('./config/db');

const PORT = env.PORT || 3001;

const server = app.listen(PORT, () => {
  console.log(`[SIMRS Node Service] Server listening on port ${PORT} (${env.NODE_ENV})`);
  console.log(`[SIMRS Node Service] Health check: http://localhost:${PORT}/api/health`);
});

let isShuttingDown = false;

const gracefulShutdown = async (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\n[SIMRS Node Service] Received ${signal}. Starting graceful shutdown...`);

  // Force shutdown if cleanup takes too long (10 seconds timeout)
  const forceExitTimeout = setTimeout(() => {
    console.error('[SIMRS Node Service] Graceful shutdown timed out. Forcing exit.');
    process.exit(1);
  }, 10000);
  forceExitTimeout.unref();

  try {
    // 1. Close HTTP server (stop accepting new incoming connections)
    await new Promise((resolve, reject) => {
      server.close((err) => {
        if (err) return reject(err);
        resolve();
      });
    });
    console.log('[SIMRS Node Service] HTTP server closed.');

    // 2. Close PostgreSQL connection pool
    await closePool();

    console.log('[SIMRS Node Service] Graceful shutdown completed cleanly.');
    process.exit(0);
  } catch (err) {
    console.error('[SIMRS Node Service] Error during graceful shutdown:', err);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  console.error('[SIMRS Node Service] Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[SIMRS Node Service] Uncaught Exception thrown:', err);
  gracefulShutdown('uncaughtException');
});
