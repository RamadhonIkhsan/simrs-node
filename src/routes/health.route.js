const express = require('express');
const healthController = require('../controllers/health.controller');

const router = express.Router();

/**
 * @openapi
 * /api/health:
 *   get:
 *     summary: Health Check Server & Database
 *     description: Memeriksa ketersediaan server Node.js dan koneksi pool PostgreSQL (SELECT 1).
 *     tags:
 *       - System
 *     security: []
 *     responses:
 *       200:
 *         description: Server dan database beroperasi normal.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 rc:
 *                   type: integer
 *                   example: 200
 *                 rm:
 *                   type: string
 *                   example: Berhasil
 *                 data:
 *                   type: object
 *                   properties:
 *                     server:
 *                       type: object
 *                       properties:
 *                         status: { type: string, example: healthy }
 *                         uptime: { type: string, example: 120s }
 *                         timestamp: { type: string, example: "2026-11-24T00:00:00.000Z" }
 *                         environment: { type: string, example: development }
 *                     database:
 *                       type: object
 *                       properties:
 *                         status: { type: string, example: healthy }
 *                         latencyMs: { type: integer, example: 5 }
 *       503:
 *         description: Database tidak dapat diakses atau koneksi terputus.
 */
router.get('/', (req, res, next) => healthController.checkHealth(req, res, next));

module.exports = router;
