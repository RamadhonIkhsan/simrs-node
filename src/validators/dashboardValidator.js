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

const dashboardQuerySchema = z
  .object({
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

module.exports = {
  dashboardQuerySchema,
  getCurrentMonthRange,
};
