const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const env = require('./env');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SIMRS Node.js Backend Service API',
      version: '1.0.0',
      description:
        'Dokumentasi API untuk backend service SIMRS Node.js (Express.js) yang berdampingan dengan Yii2 dan database PostgreSQL.',
      contact: {
        name: 'Tim SIMRS',
      },
    },
    servers: [
      {
        url: `http://localhost:${env.PORT || 3001}`,
        description: 'Local Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Masukkan JWT token yang diterbitkan oleh backend utama Yii2',
        },
      },
      schemas: {
        StandardSuccessResponse: {
          type: 'object',
          properties: {
            rc: { type: 'integer', example: 200 },
            rm: { type: 'string', example: 'Berhasil' },
            data: { type: 'object' },
            meta: { type: 'object' },
          },
        },
        StandardErrorResponse: {
          type: 'object',
          properties: {
            rc: { type: 'integer', example: 400 },
            rm: { type: 'string', example: 'Pesan deskripsi error' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string', example: 'end_date' },
                  message: { type: 'string', example: 'start_date tidak boleh lebih besar dari end_date' },
                },
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.js', './src/routes/**/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

/**
 * Configure Swagger documentation endpoints
 * @param {import('express').Application} app
 */
const setupSwagger = (app) => {
  // Swagger UI HTML interface
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customSiteTitle: 'SIMRS API Docs',
      customCss: '.swagger-ui .topbar { display: none }',
    })
  );

  // Raw OpenAPI JSON specification
  app.get('/api-docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
};

module.exports = {
  swaggerSpec,
  setupSwagger,
};
