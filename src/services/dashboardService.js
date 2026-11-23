const dashboardRepository = require('../repositories/dashboardRepository');

class DashboardService {
  /**
   * Run all dashboard aggregation queries concurrently with Promise.all
   */
  async getDashboardSummary({ startDate, endDate, poliId }) {
    const filters = { startDate, endDate, poliId };

    const [
      visitSummary,
      visitsByPoli,
      procedureSummary,
      revenueSummary,
      drugUsage,
      paymentDistribution,
    ] = await Promise.all([
      dashboardRepository.getVisitSummary(filters),
      dashboardRepository.getVisitsByPoli(filters),
      dashboardRepository.getProcedureSummary(filters),
      dashboardRepository.getRevenueSummary(filters),
      dashboardRepository.getDrugUsageSummary(filters),
      dashboardRepository.getPaymentStatusDistribution(filters),
    ]);

    return {
      kunjungan: visitSummary,
      kunjungan_per_poli: visitsByPoli,
      tindakan_medis: procedureSummary,
      pendapatan: revenueSummary,
      penggunaan_obat: drugUsage,
      distribusi_status_pembayaran: paymentDistribution,
    };
  }

  /**
   * 1. Drill-down patient visits
   */
  async getDetailedVisits({ startDate, endDate, search, poliId, dokterId, page, limit }) {
    const { rows, total } = await dashboardRepository.getDetailedVisits({
      startDate,
      endDate,
      search,
      poliId,
      dokterId,
      page,
      limit,
    });

    return {
      data: rows,
      pagination: {
        page,
        limit,
        total_data: total,
        total_pages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * 2. Drill-down medical actions/procedures
   */
  async getDetailedActions({ startDate, endDate, search, poliId, dokterId, page, limit }) {
    const { rows, total } = await dashboardRepository.getDetailedActions({
      startDate,
      endDate,
      search,
      poliId,
      dokterId,
      page,
      limit,
    });

    return {
      data: rows,
      pagination: {
        page,
        limit,
        total_data: total,
        total_pages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * 3. Drill-down medicines usage
   */
  async getDetailedMedicines({ startDate, endDate, search, poliId, page, limit }) {
    const { rows, total } = await dashboardRepository.getDetailedMedicines({
      startDate,
      endDate,
      search,
      poliId,
      page,
      limit,
    });

    return {
      data: rows,
      pagination: {
        page,
        limit,
        total_data: total,
        total_pages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * 4. Drill-down bills & payment status
   */
  async getDetailedPayments({ startDate, endDate, search, poliId, paymentStatus, page, limit }) {
    const { rows, total } = await dashboardRepository.getDetailedPayments({
      startDate,
      endDate,
      search,
      poliId,
      paymentStatus,
      page,
      limit,
    });

    return {
      data: rows,
      pagination: {
        page,
        limit,
        total_data: total,
        total_pages: Math.ceil(total / limit) || 1,
      },
    };
  }
}

module.exports = new DashboardService();
