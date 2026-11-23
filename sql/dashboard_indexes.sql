-- ============================================================================
-- SIMRS PostgreSQL Performance Optimization Indexes for Dashboard Aggregations
-- ============================================================================
-- File ini berisi DDL index untuk mempercepat query agregasi summary dan drill-down.
-- Eksekusi aman (idempotent) menggunakan klausa IF NOT EXISTS.
-- ============================================================================

-- 1. Tabel: visits (Kunjungan Pasien)
-- Alasan: Query dashboard selalu memfilter rentang tanggal kunjungan (BETWEEN $1 AND $2)
--         dan sering memfilter per poli_id serta doctor_id.
CREATE INDEX IF NOT EXISTS idx_visits_visit_date_poli_id
    ON visits (visit_date, poli_id);
COMMENT ON INDEX idx_visits_visit_date_poli_id IS 'Mengoptimalkan filter tanggal kunjungan dan filter poli pada summary serta drill-down';

CREATE INDEX IF NOT EXISTS idx_visits_doctor_id
    ON visits (doctor_id);
COMMENT ON INDEX idx_visits_doctor_id IS 'Mempercepat filter dan join berdasarkan dokter pemeriksa';

CREATE INDEX IF NOT EXISTS idx_visits_status
    ON visits (status);
COMMENT ON INDEX idx_visits_status IS 'Mempercepat kalkulasi agregasi status kunjungan (DONE, WAITING, EXAMINING, CANCELLED)';


-- 2. Tabel: visit_procedures (Tindakan Medis Pasien)
-- Alasan: Sering di-join dengan tabel visits melalui visit_id dengan kondisi status != VOIDED
--         serta di-group/filter berdasarkan procedure_id dan doctor_id.
CREATE INDEX IF NOT EXISTS idx_visit_procedures_visit_id_status
    ON visit_procedures (visit_id, status);
COMMENT ON INDEX idx_visit_procedures_visit_id_status IS 'Mempercepat join visit_procedures ke visits serta memfilter tindakan non-VOIDED';

CREATE INDEX IF NOT EXISTS idx_visit_procedures_procedure_id
    ON visit_procedures (procedure_id);
COMMENT ON INDEX idx_visit_procedures_procedure_id IS 'Mempercepat lookup tarif dan nama tindakan pada tabel procedures';

CREATE INDEX IF NOT EXISTS idx_visit_procedures_performed_at
    ON visit_procedures (performed_at DESC);
COMMENT ON INDEX idx_visit_procedures_performed_at IS 'Mempercepat pengurutan kronologis tindakan medis pada drill-down';


-- 3. Tabel: bills (Tagihan & Pembayaran)
-- Alasan: Di-join dengan tabel visits via visit_id untuk menghitung total_billed, paid_amount,
--         serta distribusi payment_status dengan filter status != CANCELLED.
CREATE INDEX IF NOT EXISTS idx_bills_visit_id_status_payment
    ON bills (visit_id, status, payment_status);
COMMENT ON INDEX idx_bills_visit_id_status_payment IS 'Mempercepat agregasi summary pendapatan, piutang, dan distribusi status pembayaran';

CREATE INDEX IF NOT EXISTS idx_bills_payment_status
    ON bills (payment_status);
COMMENT ON INDEX idx_bills_payment_status IS 'Mempercepat filter drill-down pembayaran (lunas, dibayar sebagian, belum dibayar)';

CREATE INDEX IF NOT EXISTS idx_bills_issued_at
    ON bills (issued_at DESC NULLS LAST);
COMMENT ON INDEX idx_bills_issued_at IS 'Mempercepat sorting data tagihan terbaru pada drill-down payments';


-- 4. Tabel: prescriptions & prescription_items (Resep & Penggunaan Obat)
-- Alasan: Menghubungkan kunjungan ke penggunaan obat untuk ranking top 10 obat dan rincian penggunaan obat.
CREATE INDEX IF NOT EXISTS idx_prescriptions_visit_id
    ON prescriptions (visit_id);
COMMENT ON INDEX idx_prescriptions_visit_id IS 'Mempercepat join resep dokter ke data kunjungan pasien';

CREATE INDEX IF NOT EXISTS idx_prescription_items_prescription_drug
    ON prescription_items (prescription_id, drug_id);
COMMENT ON INDEX idx_prescription_items_prescription_drug IS 'Mengoptimalkan penghitungan total kuantitas obat terpakai per resep';

CREATE INDEX IF NOT EXISTS idx_prescription_items_drug_id
    ON prescription_items (drug_id);
COMMENT ON INDEX idx_prescription_items_drug_id IS 'Mempercepat kalkulasi agregasi kuantitas obat yang sering diresepkan';


-- 5. Tabel: patients (Pencarian Pasien pada Drill-Down)
-- Alasan: Pencarian teks ILIKE pada nama pasien dan no rekam medis saat drill-down kunjungan/tagihan.
CREATE INDEX IF NOT EXISTS idx_patients_medical_record_no
    ON patients (medical_record_no);
COMMENT ON INDEX idx_patients_medical_record_no IS 'Mempercepat pencarian pasien berdasarkan No. Rekam Medis (exact match & prefix search)';

CREATE INDEX IF NOT EXISTS idx_patients_full_name
    ON patients (full_name);
COMMENT ON INDEX idx_patients_full_name IS 'Mempercepat pencarian data pasien berdasarkan nama lengkap';
