const { query } = require('../config/db');

/**
 * Dashboard Repository for read-only aggregation and drill-down queries
 */
class DashboardRepository {
  /* ==========================================================================
     SUMMARY AGGREGATION QUERIES (Task N3)
     ========================================================================== */

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

  /* ==========================================================================
     DRILL-DOWN DETAILED QUERIES (Task N6)
     ========================================================================== */

  /**
   * 1. Drill-down patient visits
   */
  async getDetailedVisits({ startDate, endDate, search, poliId = null, dokterId = null, page = 1, limit = 10 }) {
    const offset = (page - 1) * limit;
    const searchPattern = search ? `%${search}%` : null;

    const baseWhere = `
      WHERE v.visit_date BETWEEN $1 AND $2
        AND ($3::bigint IS NULL OR v.poli_id = $3)
        AND ($4::bigint IS NULL OR v.doctor_id = $4)
        AND ($5::text IS NULL OR (
          p.full_name ILIKE $5 
          OR p.medical_record_no ILIKE $5 
          OR v.visit_no ILIKE $5 
          OR pol.name ILIKE $5 
          OR d.full_name ILIKE $5
        ))
    `;

    // Count query
    const countSql = `
      SELECT COUNT(*)::int AS total
      FROM visits v
      JOIN patients p ON v.patient_id = p.id
      JOIN polis pol ON v.poli_id = pol.id
      LEFT JOIN doctors d ON v.doctor_id = d.id
      ${baseWhere};
    `;
    const countRes = await query(countSql, [startDate, endDate, poliId, dokterId, searchPattern]);
    const total = countRes.rows[0]?.total || 0;

    // Data query
    const dataSql = `
      SELECT 
        v.id,
        v.visit_no,
        v.visit_date,
        v.queue_no,
        v.status,
        v.registration_fee::numeric(15, 2) AS registration_fee,
        v.created_at,
        p.id AS patient_id,
        p.medical_record_no,
        p.full_name AS patient_name,
        p.gender,
        p.phone AS patient_phone,
        pol.id AS poli_id,
        pol.name AS poli_name,
        d.id AS doctor_id,
        d.full_name AS doctor_name,
        d.specialty AS doctor_specialty
      FROM visits v
      JOIN patients p ON v.patient_id = p.id
      JOIN polis pol ON v.poli_id = pol.id
      LEFT JOIN doctors d ON v.doctor_id = d.id
      ${baseWhere}
      ORDER BY v.visit_date DESC, v.queue_no ASC, v.id DESC
      LIMIT $6 OFFSET $7;
    `;
    const dataRes = await query(dataSql, [startDate, endDate, poliId, dokterId, searchPattern, limit, offset]);

    return {
      rows: dataRes.rows,
      total,
    };
  }

  /**
   * 2. Drill-down medical actions/procedures
   */
  async getDetailedActions({ startDate, endDate, search, poliId = null, dokterId = null, page = 1, limit = 10 }) {
    const offset = (page - 1) * limit;
    const searchPattern = search ? `%${search}%` : null;

    const baseWhere = `
      WHERE v.visit_date BETWEEN $1 AND $2
        AND vp.status != 'VOIDED'
        AND ($3::bigint IS NULL OR v.poli_id = $3)
        AND ($4::bigint IS NULL OR vp.doctor_id = $4)
        AND ($5::text IS NULL OR (
          pr.name ILIKE $5 
          OR pr.code ILIKE $5 
          OR p.full_name ILIKE $5 
          OR p.medical_record_no ILIKE $5 
          OR v.visit_no ILIKE $5 
          OR pol.name ILIKE $5 
          OR d.full_name ILIKE $5
        ))
    `;

    // Count query
    const countSql = `
      SELECT COUNT(*)::int AS total
      FROM visit_procedures vp
      JOIN procedures pr ON vp.procedure_id = pr.id
      JOIN visits v ON vp.visit_id = v.id
      JOIN patients p ON v.patient_id = p.id
      JOIN polis pol ON v.poli_id = pol.id
      LEFT JOIN doctors d ON vp.doctor_id = d.id
      ${baseWhere};
    `;
    const countRes = await query(countSql, [startDate, endDate, poliId, dokterId, searchPattern]);
    const total = countRes.rows[0]?.total || 0;

    // Data query
    const dataSql = `
      SELECT 
        vp.id,
        vp.performed_at,
        vp.qty,
        vp.unit_tariff::numeric(15, 2) AS unit_tariff,
        (vp.qty * vp.unit_tariff)::numeric(15, 2) AS subtotal,
        vp.status AS action_status,
        pr.id AS procedure_id,
        pr.code AS procedure_code,
        pr.name AS procedure_name,
        v.id AS visit_id,
        v.visit_no,
        v.visit_date,
        p.id AS patient_id,
        p.medical_record_no,
        p.full_name AS patient_name,
        pol.id AS poli_id,
        pol.name AS poli_name,
        d.id AS doctor_id,
        d.full_name AS doctor_name,
        d.specialty AS doctor_specialty
      FROM visit_procedures vp
      JOIN procedures pr ON vp.procedure_id = pr.id
      JOIN visits v ON vp.visit_id = v.id
      JOIN patients p ON v.patient_id = p.id
      JOIN polis pol ON v.poli_id = pol.id
      LEFT JOIN doctors d ON vp.doctor_id = d.id
      ${baseWhere}
      ORDER BY vp.performed_at DESC, vp.id DESC
      LIMIT $6 OFFSET $7;
    `;
    const dataRes = await query(dataSql, [startDate, endDate, poliId, dokterId, searchPattern, limit, offset]);

    return {
      rows: dataRes.rows,
      total,
    };
  }

  /**
   * 3. Drill-down medicines usage recap
   */
  async getDetailedMedicines({ startDate, endDate, search, poliId = null, page = 1, limit = 10 }) {
    const offset = (page - 1) * limit;
    const searchPattern = search ? `%${search}%` : null;

    const baseWhere = `
      WHERE v.visit_date BETWEEN $1 AND $2
        AND ($3::bigint IS NULL OR v.poli_id = $3)
        AND ($4::text IS NULL OR (
          d.name ILIKE $4 
          OR d.code ILIKE $4
        ))
    `;

    // Count distinct drugs matching the criteria
    const countSql = `
      SELECT COUNT(DISTINCT d.id)::int AS total
      FROM prescription_items pi
      JOIN prescriptions pr ON pi.prescription_id = pr.id
      JOIN visits v ON pr.visit_id = v.id
      JOIN drugs d ON pi.drug_id = d.id
      ${baseWhere};
    `;
    const countRes = await query(countSql, [startDate, endDate, poliId, searchPattern]);
    const total = countRes.rows[0]?.total || 0;

    // Data query
    const dataSql = `
      SELECT 
        d.id AS drug_id,
        d.code AS drug_code,
        d.name AS drug_name,
        d.unit,
        d.price::numeric(15, 2) AS current_price,
        d.stock AS current_stock,
        COALESCE(SUM(pi.qty), 0)::int AS total_dispensed,
        COALESCE(SUM(pi.qty * pi.unit_price), 0)::numeric(15, 2) AS estimated_value,
        COUNT(DISTINCT v.id)::int AS total_visits_count
      FROM prescription_items pi
      JOIN prescriptions pr ON pi.prescription_id = pr.id
      JOIN visits v ON pr.visit_id = v.id
      JOIN drugs d ON pi.drug_id = d.id
      ${baseWhere}
      GROUP BY d.id, d.code, d.name, d.unit, d.price, d.stock
      ORDER BY total_dispensed DESC, estimated_value DESC, d.name ASC
      LIMIT $5 OFFSET $6;
    `;
    const dataRes = await query(dataSql, [startDate, endDate, poliId, searchPattern, limit, offset]);

    return {
      rows: dataRes.rows,
      total,
    };
  }

  /**
   * 4. Drill-down bills & payment status
   */
  async getDetailedPayments({ startDate, endDate, search, poliId = null, paymentStatus = null, page = 1, limit = 10 }) {
    const offset = (page - 1) * limit;
    const searchPattern = search ? `%${search}%` : null;

    // Normalize paymentStatus filter if given (e.g. 'belum_dibayar' -> 'UNPAID', 'lunas' -> 'PAID')
    let normalizedStatus = paymentStatus;
    if (paymentStatus) {
      const map = {
        belum_dibayar: 'UNPAID',
        dibayar_sebagian: 'PARTIAL',
        lunas: 'PAID',
        UNPAID: 'UNPAID',
        PARTIAL: 'PARTIAL',
        PAID: 'PAID',
      };
      normalizedStatus = map[paymentStatus] || paymentStatus.toUpperCase();
    }

    const baseWhere = `
      WHERE v.visit_date BETWEEN $1 AND $2
        AND b.status != 'CANCELLED'
        AND ($3::bigint IS NULL OR v.poli_id = $3)
        AND ($4::varchar IS NULL OR b.payment_status = $4)
        AND ($5::text IS NULL OR (
          b.bill_no ILIKE $5 
          OR p.full_name ILIKE $5 
          OR p.medical_record_no ILIKE $5 
          OR v.visit_no ILIKE $5 
          OR pol.name ILIKE $5
        ))
    `;

    // Count query
    const countSql = `
      SELECT COUNT(*)::int AS total
      FROM bills b
      JOIN visits v ON b.visit_id = v.id
      JOIN patients p ON b.patient_id = p.id
      JOIN polis pol ON v.poli_id = pol.id
      ${baseWhere};
    `;
    const countRes = await query(countSql, [startDate, endDate, poliId, normalizedStatus, searchPattern]);
    const total = countRes.rows[0]?.total || 0;

    // Data query
    const dataSql = `
      SELECT 
        b.id,
        b.bill_no,
        b.issued_at,
        b.status AS bill_status,
        b.payment_status AS raw_payment_status,
        CASE 
          WHEN b.payment_status = 'PAID' THEN 'lunas'
          WHEN b.payment_status = 'PARTIAL' THEN 'dibayar_sebagian'
          WHEN b.payment_status = 'UNPAID' THEN 'belum_dibayar'
          ELSE LOWER(b.payment_status)
        END AS payment_status,
        b.total_amount::numeric(15, 2) AS total_amount,
        b.paid_amount::numeric(15, 2) AS paid_amount,
        (b.total_amount - b.paid_amount)::numeric(15, 2) AS unpaid_amount,
        v.id AS visit_id,
        v.visit_no,
        v.visit_date,
        p.id AS patient_id,
        p.medical_record_no,
        p.full_name AS patient_name,
        pol.id AS poli_id,
        pol.name AS poli_name
      FROM bills b
      JOIN visits v ON b.visit_id = v.id
      JOIN patients p ON b.patient_id = p.id
      JOIN polis pol ON v.poli_id = pol.id
      ${baseWhere}
      ORDER BY b.issued_at DESC NULLS LAST, b.id DESC
      LIMIT $6 OFFSET $7;
    `;
    const dataRes = await query(dataSql, [startDate, endDate, poliId, normalizedStatus, searchPattern, limit, offset]);

    return {
      rows: dataRes.rows,
      total,
    };
  }
}

module.exports = new DashboardRepository();
