const dashboardService = require('../services/dashboardService');
const { successResponse } = require('../utils/response');

class DashboardController {
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
}

module.exports = new DashboardController();
