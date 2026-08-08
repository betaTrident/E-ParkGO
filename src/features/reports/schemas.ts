import { z } from 'zod'

const businessDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must use YYYY-MM-DD format')

const sessionStatusSchema = z.enum([
  'ACTIVE',
  'EXIT_PENDING',
  'PAYMENT_PENDING',
  'PAID_AWAITING_EXIT',
  'COMPLETED',
  'CANCELLED',
  'LOST_TICKET',
  'MANUAL_REVIEW',
])

export const reportTypeSchema = z.enum([
  'DAILY_REVENUE',
  'OCCUPANCY',
  'MOVEMENTS',
  'SHIFT_RECONCILIATION',
])

export const baseTransactionQuerySchema = z
  .object({
    from: businessDateSchema,
    to: businessDateSchema,
    status: sessionStatusSchema.optional(),
    plate: z.string().min(2).max(12).optional(),
    cursor: z.string().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  })
  .strict()

export const transactionQuerySchema = baseTransactionQuerySchema
  .superRefine((value, ctx) => {
    const fromDate = new Date(`${value.from}T00:00:00Z`)
    const toDate = new Date(`${value.to}T00:00:00Z`)
    if (fromDate > toDate) {
      ctx.addIssue({
        code: 'custom',
        message: 'from must be on or before to',
        path: ['from'],
      })
    }

    const daySpan = Math.floor((toDate.getTime() - fromDate.getTime()) / 86_400_000)
    if (daySpan > 90) {
      ctx.addIssue({
        code: 'custom',
        message: 'Date range cannot exceed 90 days',
        path: ['to'],
      })
    }
  })

const baseReportSchema = z
  .object({
    type: reportTypeSchema,
    from: businessDateSchema,
    to: businessDateSchema,
  })
  .strict()

function validateDateSpan90(value: { from: string; to: string }, ctx: z.RefinementCtx) {
  const fromDate = new Date(`${value.from}T00:00:00Z`)
  const toDate = new Date(`${value.to}T00:00:00Z`)
  if (fromDate > toDate) {
    ctx.addIssue({
      code: 'custom',
      message: 'from must be on or before to',
      path: ['from'],
    })
  }

  const daySpan = Math.floor((toDate.getTime() - fromDate.getTime()) / 86_400_000)
  if (daySpan > 90) {
    ctx.addIssue({
      code: 'custom',
      message: 'Date range cannot exceed 90 days',
      path: ['to'],
    })
  }
}

export const reportPreviewSchema = baseReportSchema.superRefine(validateDateSpan90)

export const reportExportSchema = baseReportSchema
  .extend({
    idempotency_key: z.string().uuid('Idempotency key is required'),
    correlation_id: z.string().uuid().optional(),
  })
  .superRefine((value, ctx) => {
    const fromDate = new Date(`${value.from}T00:00:00Z`)
    const toDate = new Date(`${value.to}T00:00:00Z`)
    const daySpan = Math.floor((toDate.getTime() - fromDate.getTime()) / 86_400_000)
    if (daySpan > 366) {
      ctx.addIssue({
        code: 'custom',
        message: 'Date range cannot exceed 366 days',
        path: ['to'],
      })
    }
  })

export const auditSearchSchema = z
  .object({
    from: z.string().datetime({ offset: true }),
    to: z.string().datetime({ offset: true }),
    action: z.string().min(1).max(80).optional(),
    actor_id: z.string().uuid().optional(),
    correlation_id: z.string().uuid().optional(),
    cursor: z.string().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  })
  .strict()

export type TransactionQueryInput = z.infer<typeof transactionQuerySchema>
export type ReportPreviewInput = z.infer<typeof reportPreviewSchema>
export type ReportExportInput = z.infer<typeof reportExportSchema>
export type AuditSearchInput = z.infer<typeof auditSearchSchema>
