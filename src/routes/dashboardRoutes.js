const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');
const validateRequest = require('../middlewares/validateRequest');
const { cacheMiddleware } = require('../middlewares/cacheMiddleware');
const {
  dashboardQuerySchema,
  drilldownVisitsSchema,
  drilldownActionsSchema,
  drilldownMedicinesSchema,
  drilldownPaymentsSchema,
} = require('../validators/dashboardValidator');
const { ROLES } = require('../utils/roles');

const router = express.Router();

// Apply auth and admin authorization to all dashboard routes
router.use(authMiddleware);
router.use(authorizeRoles(ROLES.ADMINISTRATOR));

/**
 * @openapi
 * /api/dashboard/summary:
 *   get:
 *     summary: Ringkasan Metrik Dashboard
 *     description: Mengambil agregasi metrik kunjungan, pendapatan, tindakan medis, penggunaan obat, dan status pembayaran. Dilengkapi in-memory caching 60 detik (X-Cache header).
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *           example: "2026-11-01"
 *         description: Tanggal awal filter (YYYY-MM-DD). Default awal bulan berjalan.
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *           example: "2026-11-30"
 *         description: Tanggal akhir filter (YYYY-MM-DD). Default akhir bulan berjalan.
 *       - in: query
 *         name: poli_id
 *         schema:
 *           type: integer
 *           example: 11
 *         description: ID Poli untuk filter spesifik (opsional).
 *     responses:
 *       200:
 *         description: Ringkasan dashboard berhasil dimuat.
 *         headers:
 *           X-Cache:
 *             schema:
 *               type: string
 *               example: HIT
 *             description: Status cache (HIT atau MISS).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardSuccessResponse'
 *       401:
 *         description: Token otentikasi tidak valid atau tidak disertakan.
 *       403:
 *         description: Akses ditolak (bukan Administrator).
 *       422:
 *         description: Validasi query params gagal.
 */
router.get(
  '/summary',
  validateRequest({ query: dashboardQuerySchema }),
  cacheMiddleware(60),
  (req, res, next) => dashboardController.getSummary(req, res, next)
);

/**
 * @openapi
 * /api/dashboard/details/visits:
 *   get:
 *     summary: Drill-Down Rincian Kunjungan Pasien
 *     description: Mengambil daftar rincian kunjungan pasien dengan pagination, filter pencarian, poli, dan dokter.
 *     tags:
 *       - Dashboard Drill-Down
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema: { type: string, format: date, example: "2026-11-01" }
 *       - in: query
 *         name: end_date
 *         schema: { type: string, format: date, example: "2026-11-30" }
 *       - in: query
 *         name: search
 *         schema: { type: string, example: "Budi" }
 *         description: Cari berdasarkan nama pasien, no rekam medis, no kunjungan, poli, atau dokter.
 *       - in: query
 *         name: poli_id
 *         schema: { type: integer, example: 11 }
 *       - in: query
 *         name: dokter_id
 *         schema: { type: integer, example: 2 }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Data rincian kunjungan berhasil diambil.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardSuccessResponse'
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 */
router.get(
  '/details/visits',
  validateRequest({ query: drilldownVisitsSchema }),
  (req, res, next) => dashboardController.getDetailedVisits(req, res, next)
);

/**
 * @openapi
 * /api/dashboard/details/actions:
 *   get:
 *     summary: Drill-Down Rincian Tindakan Medis
 *     description: Mengambil rincian tindakan medis yang dilakukan, tarif satuan, subtotal, serta dokter pelaksana.
 *     tags:
 *       - Dashboard Drill-Down
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: end_date
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: poli_id
 *         schema: { type: integer }
 *       - in: query
 *         name: dokter_id
 *         schema: { type: integer }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Data rincian tindakan medis berhasil diambil.
 */
router.get(
  '/details/actions',
  validateRequest({ query: drilldownActionsSchema }),
  (req, res, next) => dashboardController.getDetailedActions(req, res, next)
);

/**
 * @openapi
 * /api/dashboard/details/medicines:
 *   get:
 *     summary: Drill-Down Rekapitulasi Penggunaan Obat
 *     description: Mengambil rekap penggunaan obat, kuantitas keluar, stok terkini, dan estimasi nilai nominal.
 *     tags:
 *       - Dashboard Drill-Down
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: end_date
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Cari nama obat atau kode obat.
 *       - in: query
 *         name: poli_id
 *         schema: { type: integer }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Data rekapitulasi obat berhasil diambil.
 */
router.get(
  '/details/medicines',
  validateRequest({ query: drilldownMedicinesSchema }),
  (req, res, next) => dashboardController.getDetailedMedicines(req, res, next)
);

/**
 * @openapi
 * /api/dashboard/details/payments:
 *   get:
 *     summary: Drill-Down Rincian Tagihan & Pembayaran
 *     description: Mengambil rincian billing, status pembayaran (belum dibayar, dibayar sebagian, lunas), nominal terbayar, dan sisa piutang.
 *     tags:
 *       - Dashboard Drill-Down
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: end_date
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Cari no tagihan, nama pasien, no rekam medis, atau no kunjungan.
 *       - in: query
 *         name: poli_id
 *         schema: { type: integer }
 *       - in: query
 *         name: payment_status
 *         schema:
 *           type: string
 *           enum: [belum_dibayar, dibayar_sebagian, lunas]
 *         description: Filter status pembayaran.
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Data rincian billing dan pembayaran berhasil diambil.
 */
router.get(
  '/details/payments',
  validateRequest({ query: drilldownPaymentsSchema }),
  (req, res, next) => dashboardController.getDetailedPayments(req, res, next)
);

module.exports = router;
