const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const env = require('./config/env');
const apiRoutes = require('./routes');
const { setupSwagger } = require('./config/swagger');
const notFoundHandler = require('./middlewares/notFoundHandler');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// Security HTTP headers (disable CSP in development/docs to allow Swagger UI inline assets)
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

// Enable CORS
app.use(cors());

// HTTP request logging
app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup OpenAPI / Swagger UI documentation at /api-docs
setupSwagger(app);

// Root info route
app.get('/', (_req, res) => {
  res.json({
    rc: 200,
    rm: 'Berhasil',
    data: {
      name: 'SIMRS Node Service',
      status: 'running',
      docs: '/api-docs',
      health: '/api/health',
    },
  });
});

// API Routes
app.use('/api', apiRoutes);

// 404 Handler for undefined routes
app.use(notFoundHandler);

// Centralized Global Error Handler (must be last middleware)
app.use(errorHandler);

module.exports = app;
