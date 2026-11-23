const dashboardService = require('../services/dashboardService');
const { successResponse } = require('../utils/response');

class DashboardController {
  /**
   * Summary overview API
   */
  async getSummary(req, res, next) {
    try {
      const { start_date, end_date, poli_id } = req.query;

      const data = await dashboardService.getDashboardSummary({
        startDate: start_date,
        endDate: end_date,
        poliId: poli_id ? Number(poli_id) : null,
      });

      return successResponse(res, {
        statusCode: 200,
        message: 'Berhasil',
        data,
        meta: {
          period: {
            start_date,
            end_date,
          },
          filters: {
            poli_id: poli_id ? Number(poli_id) : null,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Drill-down: Visits
   */
  async getDetailedVisits(req, res, next) {
    try {
      const { start_date, end_date, search, poli_id, dokter_id, page, limit } = req.query;

      const result = await dashboardService.getDetailedVisits({
        startDate: start_date,
        endDate: end_date,
        search,
        poliId: poli_id ? Number(poli_id) : null,
        dokterId: dokter_id ? Number(dokter_id) : null,
        page: Number(page) || 1,
        limit: Number(limit) || 10,
      });

      return successResponse(res, {
        statusCode: 200,
        message: 'Berhasil',
        data: result.data,
        meta: {
          ...result.pagination,
          period: {
            start_date,
            end_date,
          },
          filters: {
            search: search || null,
            poli_id: poli_id ? Number(poli_id) : null,
            dokter_id: dokter_id ? Number(dokter_id) : null,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Drill-down: Actions / Medical procedures
   */
  async getDetailedActions(req, res, next) {
    try {
      const { start_date, end_date, search, poli_id, dokter_id, page, limit } = req.query;

      const result = await dashboardService.getDetailedActions({
        startDate: start_date,
        endDate: end_date,
        search,
        poliId: poli_id ? Number(poli_id) : null,
        dokterId: dokter_id ? Number(dokter_id) : null,
        page: Number(page) || 1,
        limit: Number(limit) || 10,
      });

      return successResponse(res, {
        statusCode: 200,
        message: 'Berhasil',
        data: result.data,
        meta: {
          ...result.pagination,
          period: {
            start_date,
            end_date,
          },
          filters: {
            search: search || null,
            poli_id: poli_id ? Number(poli_id) : null,
            dokter_id: dokter_id ? Number(dokter_id) : null,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Drill-down: Medicines usage recap
   */
  async getDetailedMedicines(req, res, next) {
    try {
      const { start_date, end_date, search, poli_id, page, limit } = req.query;

      const result = await dashboardService.getDetailedMedicines({
        startDate: start_date,
        endDate: end_date,
        search,
        poliId: poli_id ? Number(poli_id) : null,
        page: Number(page) || 1,
        limit: Number(limit) || 10,
      });

      return successResponse(res, {
        statusCode: 200,
        message: 'Berhasil',
        data: result.data,
        meta: {
          ...result.pagination,
          period: {
            start_date,
            end_date,
          },
          filters: {
            search: search || null,
            poli_id: poli_id ? Number(poli_id) : null,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Drill-down: Bills & Payment status
   */
  async getDetailedPayments(req, res, next) {
    try {
      const { start_date, end_date, search, poli_id, payment_status, page, limit } = req.query;

      const result = await dashboardService.getDetailedPayments({
        startDate: start_date,
        endDate: end_date,
        search,
        poliId: poli_id ? Number(poli_id) : null,
        paymentStatus: payment_status || null,
        page: Number(page) || 1,
        limit: Number(limit) || 10,
      });

      return successResponse(res, {
        statusCode: 200,
        message: 'Berhasil',
        data: result.data,
        meta: {
          ...result.pagination,
          period: {
            start_date,
            end_date,
          },
          filters: {
            search: search || null,
            poli_id: poli_id ? Number(poli_id) : null,
            payment_status: payment_status || null,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new DashboardController();
