import { z } from 'zod'

import { isCentavosString } from '@/lib/money/centavos'

const forbiddenExitFields = [
  'actor_id',
  'actorId',
  'location_id',
  'locationId',
  'parking_location_id',
  'status',
  'entry_time',
  'entryTime',
  'total_centavos',
  'totalCentavos',
  'fee_version',
  'feeVersion',
  'quote_expires_at',
  'quoteExpiresAt',
] as const

export function containsForbiddenExitField(input: Record<string, unknown>): boolean {
  return forbiddenExitFields.some((field) => field in input)
}

const centavosSchema = z
  .string()
  .refine(isCentavosString, 'Amount must be a nonnegative integer centavos string')

export const exitPreviewRequestSchema = z
  .object({
    session_id: z.uuid('Session id is required'),
    idempotency_key: z.uuid('Idempotency key is required'),
    correlation_id: z.uuid('Correlation id is required').optional(),
  })
  .strict()

export type ExitPreviewRequestInput = z.infer<typeof exitPreviewRequestSchema>

export const exitPreviewResultSchema = z.object({
  session_id: z.uuid(),
  status: z.enum(['PAYMENT_PENDING', 'PAID_AWAITING_EXIT']),
  billed_minutes: z.number().int().nonnegative(),
  subtotal_centavos: centavosSchema,
  discount_centavos: centavosSchema,
  penalty_centavos: centavosSchema,
  adjustment_centavos: centavosSchema,
  total_centavos: centavosSchema,
  fee_version: z.number().int().positive(),
  quote_expires_at: z.string(),
})

export type ExitPreviewResult = z.infer<typeof exitPreviewResultSchema>
