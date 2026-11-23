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
}

module.exports = new DashboardService();
