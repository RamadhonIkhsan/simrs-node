const express = require('express');
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

/**
 * @openapi
 * /api/auth/verify:
 *   get:
 *     summary: Verifikasi Token JWT Yii2
 *     description: Memvalidasi token JWT (HS256) yang diterbitkan oleh backend utama Yii2 dan mengembalikan data pengguna.
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token valid dan berhasil diverifikasi.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 rc: { type: integer, example: 200 }
 *                 rm: { type: string, example: Berhasil }
 *                 data:
 *                   type: object
 *                   properties:
 *                     id: { type: integer, example: 2 }
 *                     username: { type: string, example: admin }
 *                     role_id: { type: integer, example: 1 }
 *                     role_name: { type: string, example: Administrator }
 *       401:
 *         description: Token tidak ada, malformed, atau telah kedaluwarsa.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardErrorResponse'
 */
router.get('/verify', authMiddleware, (req, res) => authController.verify(req, res));

module.exports = router;
