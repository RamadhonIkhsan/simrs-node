const { query } = require('../config/db');

/**
 * Dashboard Repository for read-only aggregation queries
 */
class DashboardRepository {
  /**
   * Total and status breakdown of patient visits
   */
  async getVisitSummary({ startDate, endDate, poliId = null }) {
    const sql = `
      SELECT 
        COUNT(*)::int AS total_visits,
        COUNT(CASE WHEN status = 'DONE' THEN 1 END)::int AS completed,
        COUNT(CASE WHEN status = 'WAITING' THEN 1 END)::int AS waiting,
        COUNT(CASE WHEN status = 'EXAMINING' THEN 1 END)::int AS examining,
        COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END)::int AS cancelled
      FROM visits
      WHERE visit_date BETWEEN $1 AND $2
        AND ($3::bigint IS NULL OR poli_id = $3);
    `;
    const res = await query(sql, [startDate, endDate, poliId]);
    return res.rows[0] || {
      total_visits: 0,
      completed: 0,
      waiting: 0,
      examining: 0,
      cancelled: 0,
    };
  }

  /**
   * Total visits grouped by polyclinic
   */
  async getVisitsByPoli({ startDate, endDate, poliId = null }) {
    const sql = `
      SELECT 
        p.id AS poli_id,
        p.name AS poli_name,
        COUNT(v.id)::int AS total_visits
      FROM polis p
      LEFT JOIN visits v ON p.id = v.poli_id AND v.visit_date BETWEEN $1 AND $2
      WHERE p.deleted_at IS NULL
        AND ($3::bigint IS NULL OR p.id = $3)
      GROUP BY p.id, p.name
      ORDER BY total_visits DESC, p.name ASC;
    `;
    const res = await query(sql, [startDate, endDate, poliId]);
    return res.rows;
  }

  /**
   * Total medical procedures performed
   */
  async getProcedureSummary({ startDate, endDate, poliId = null }) {
    const sql = `
      SELECT 
        COUNT(vp.id)::int AS total_procedures_count,
        COALESCE(SUM(vp.qty), 0)::int AS total_procedures_qty,
        COALESCE(SUM(vp.qty * vp.unit_tariff), 0)::numeric(15, 2) AS total_procedures_amount
      FROM visit_procedures vp
      JOIN visits v ON vp.visit_id = v.id
      WHERE v.visit_date BETWEEN $1 AND $2
        AND ($3::bigint IS NULL OR v.poli_id = $3)
        AND vp.status != 'VOIDED';
    `;
    const res = await query(sql, [startDate, endDate, poliId]);
    const row = res.rows[0] || {};
    return {
      total_procedures_count: Number(row.total_procedures_count || 0),
      total_procedures_qty: Number(row.total_procedures_qty || 0),
      total_procedures_amount: Number(row.total_procedures_amount || 0),
    };
  }

  /**
   * Revenue summary (billed, paid/received, unpaid/receivable)
   */
  async getRevenueSummary({ startDate, endDate, poliId = null }) {
    const sql = `
      SELECT 
        COALESCE(SUM(b.total_amount), 0)::numeric(15, 2) AS total_billed,
        COALESCE(SUM(b.paid_amount), 0)::numeric(15, 2) AS total_paid,
        COALESCE(SUM(b.total_amount - b.paid_amount), 0)::numeric(15, 2) AS total_unpaid
      FROM bills b
      JOIN visits v ON b.visit_id = v.id
      WHERE v.visit_date BETWEEN $1 AND $2
        AND ($3::bigint IS NULL OR v.poli_id = $3)
        AND b.status != 'CANCELLED';
    `;
    const res = await query(sql, [startDate, endDate, poliId]);
    const row = res.rows[0] || {};
    return {
      total_billed: Number(row.total_billed || 0),
      total_paid: Number(row.total_paid || 0),
      total_unpaid: Number(row.total_unpaid || 0),
    };
  }

  /**
   * Top drugs usage by quantity
   */
  async getDrugUsageSummary({ startDate, endDate, poliId = null, limit = 10 }) {
    const sql = `
      SELECT 
        d.id AS drug_id,
        d.name AS drug_name,
        d.unit,
        COALESCE(SUM(pi.qty), 0)::int AS total_qty,
        COALESCE(SUM(pi.qty * pi.unit_price), 0)::numeric(15, 2) AS total_amount
      FROM prescription_items pi
      JOIN prescriptions pr ON pi.prescription_id = pr.id
      JOIN visits v ON pr.visit_id = v.id
      JOIN drugs d ON pi.drug_id = d.id
      WHERE v.visit_date BETWEEN $1 AND $2
        AND ($3::bigint IS NULL OR v.poli_id = $3)
      GROUP BY d.id, d.name, d.unit
      ORDER BY total_qty DESC
      LIMIT $4;
    `;
    const res = await query(sql, [startDate, endDate, poliId, limit]);
    return res.rows.map((row) => ({
      drug_id: row.drug_id,
      drug_name: row.drug_name,
      unit: row.unit,
      total_qty: Number(row.total_qty),
      total_amount: Number(row.total_amount),
    }));
  }

  /**
   * Payment status distribution (lunas, dibayar_sebagian, belum_dibayar)
   */
  async getPaymentStatusDistribution({ startDate, endDate, poliId = null }) {
    const sql = `
      SELECT 
        b.payment_status,
        COUNT(b.id)::int AS count,
        COALESCE(SUM(b.total_amount), 0)::numeric(15, 2) AS total_amount,
        COALESCE(SUM(b.paid_amount), 0)::numeric(15, 2) AS paid_amount
      FROM bills b
      JOIN visits v ON b.visit_id = v.id
      WHERE v.visit_date BETWEEN $1 AND $2
        AND ($3::bigint IS NULL OR v.poli_id = $3)
        AND b.status != 'CANCELLED'
      GROUP BY b.payment_status
      ORDER BY b.payment_status ASC;
    `;
    const res = await query(sql, [startDate, endDate, poliId]);

    const statusMap = {
      PAID: 'lunas',
      PARTIAL: 'dibayar_sebagian',
      UNPAID: 'belum_dibayar',
    };

    return res.rows.map((row) => ({
      status: statusMap[row.payment_status] || row.payment_status.toLowerCase(),
      raw_status: row.payment_status,
      count: Number(row.count),
      total_amount: Number(row.total_amount),
      paid_amount: Number(row.paid_amount),
    }));
  }
}

module.exports = new DashboardRepository();
