const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const env = require('./config/env');
const apiRoutes = require('./routes');
const notFoundHandler = require('./middlewares/not-found.middleware');
const errorHandler = require('./middlewares/error.middleware');

const app = express();

// Security HTTP headers
app.use(helmet());

// Enable CORS
app.use(cors());

// HTTP request logging
app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root info route
app.get('/', (_req, res) => {
  res.json({
    name: 'SIMRS Node Service',
    status: 'running',
    docs: '/api/health',
  });
});

// API Routes
app.use('/api', apiRoutes);

// 404 Handler
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);

module.exports = app;
