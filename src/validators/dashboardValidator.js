const { z } = require('zod');

/**
 * Helper to compute default date range (current month: first day to last day)
 */
const getCurrentMonthRange = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const start_date = `${year}-${month}-01`;
  const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
  const end_date = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
  return { start_date, end_date };
};

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

// Base period schema
const basePeriodSchema = {
  start_date: z
    .string()
    .regex(dateRegex, 'Format start_date harus YYYY-MM-DD')
    .optional()
    .default(() => getCurrentMonthRange().start_date),
  end_date: z
    .string()
    .regex(dateRegex, 'Format end_date harus YYYY-MM-DD')
    .optional()
    .default(() => getCurrentMonthRange().end_date),
};

// Base pagination & search schema
const basePaginationSchema = {
  ...basePeriodSchema,
  search: z.string().trim().optional(),
  page: z.coerce
    .number({ invalid_type_error: 'page harus berupa angka' })
    .int('page harus berupa bilangan bulat')
    .min(1, 'page minimal bernilai 1')
    .optional()
    .default(1),
  limit: z.coerce
    .number({ invalid_type_error: 'limit harus berupa angka' })
    .int('limit harus berupa bilangan bulat')
    .min(1, 'limit minimal bernilai 1')
    .max(100, 'limit maksimal bernilai 100')
    .optional()
    .default(10),
};

// 1. Dashboard summary query schema
const dashboardQuerySchema = z
  .object({
    ...basePeriodSchema,
    poli_id: z.coerce
      .number({ invalid_type_error: 'poli_id harus berupa angka' })
      .int('poli_id harus berupa bilangan bulat')
      .positive('poli_id harus lebih besar dari 0')
      .optional(),
  })
  .refine((data) => data.start_date <= data.end_date, {
    message: 'start_date tidak boleh lebih besar dari end_date',
    path: ['end_date'],
  });

// 2. Drill-down visits schema
const drilldownVisitsSchema = z
  .object({
    ...basePaginationSchema,
    poli_id: z.coerce
      .number({ invalid_type_error: 'poli_id harus berupa angka' })
      .int('poli_id harus berupa bilangan bulat')
      .positive('poli_id harus lebih besar dari 0')
      .optional(),
    dokter_id: z.coerce
      .number({ invalid_type_error: 'dokter_id harus berupa angka' })
      .int('dokter_id harus berupa bilangan bulat')
      .positive('dokter_id harus lebih besar dari 0')
      .optional(),
  })
  .refine((data) => data.start_date <= data.end_date, {
    message: 'start_date tidak boleh lebih besar dari end_date',
    path: ['end_date'],
  });

// 3. Drill-down actions (tindakan medis) schema
const drilldownActionsSchema = z
  .object({
    ...basePaginationSchema,
    poli_id: z.coerce
      .number({ invalid_type_error: 'poli_id harus berupa angka' })
      .int('poli_id harus berupa bilangan bulat')
      .positive('poli_id harus lebih besar dari 0')
      .optional(),
    dokter_id: z.coerce
      .number({ invalid_type_error: 'dokter_id harus berupa angka' })
      .int('dokter_id harus berupa bilangan bulat')
      .positive('dokter_id harus lebih besar dari 0')
      .optional(),
  })
  .refine((data) => data.start_date <= data.end_date, {
    message: 'start_date tidak boleh lebih besar dari end_date',
    path: ['end_date'],
  });

// 4. Drill-down medicines schema
const drilldownMedicinesSchema = z
  .object({
    ...basePaginationSchema,
    poli_id: z.coerce
      .number({ invalid_type_error: 'poli_id harus berupa angka' })
      .int('poli_id harus berupa bilangan bulat')
      .positive('poli_id harus lebih besar dari 0')
      .optional(),
  })
  .refine((data) => data.start_date <= data.end_date, {
    message: 'start_date tidak boleh lebih besar dari end_date',
    path: ['end_date'],
  });

// 5. Drill-down payments schema
const drilldownPaymentsSchema = z
  .object({
    ...basePaginationSchema,
    poli_id: z.coerce
      .number({ invalid_type_error: 'poli_id harus berupa angka' })
      .int('poli_id harus berupa bilangan bulat')
      .positive('poli_id harus lebih besar dari 0')
      .optional(),
    payment_status: z
      .enum(['belum_dibayar', 'dibayar_sebagian', 'lunas', 'UNPAID', 'PARTIAL', 'PAID'], {
        invalid_type_error: 'payment_status harus salah satu dari: belum_dibayar, dibayar_sebagian, lunas',
      })
      .optional(),
  })
  .refine((data) => data.start_date <= data.end_date, {
    message: 'start_date tidak boleh lebih besar dari end_date',
    path: ['end_date'],
  });

module.exports = {
  dashboardQuerySchema,
  drilldownVisitsSchema,
  drilldownActionsSchema,
  drilldownMedicinesSchema,
  drilldownPaymentsSchema,
  getCurrentMonthRange,
};
