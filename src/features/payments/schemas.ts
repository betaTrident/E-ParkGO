import { z } from 'zod'

import { isCentavosString } from '@/lib/money/centavos'

const forbiddenPaymentFields = [
  'actor_id',
  'actorId',
  'location_id',
  'locationId',
  'parking_location_id',
  'amount_centavos',
  'amountCentavos',
  'total_centavos',
  'totalCentavos',
  'session_status',
  'status',
  'fee_version',
  'feeVersion',
] as const

export function containsForbiddenPaymentField(input: Record<string, unknown>): boolean {
  return forbiddenPaymentFields.some((field) => field in input)
}

const centavosSchema = z
  .string()
  .refine(isCentavosString, 'Amount must be a nonnegative integer centavos string')

export const paymentRequestSchema = z
  .object({
    session_id: z.uuid('Session id is required'),
    cash_tendered_centavos: centavosSchema,
    external_reference: z.string().min(1).max(64).optional(),
    idempotency_key: z.uuid('Idempotency key is required'),
    correlation_id: z.uuid().optional(),
  })
  .strict()

export const exitConfirmationRequestSchema = z
  .object({
    session_id: z.uuid('Session id is required'),
    idempotency_key: z.uuid('Idempotency key is required'),
    correlation_id: z.uuid().optional(),
  })
  .strict()

export type PaymentRequestInput = z.infer<typeof paymentRequestSchema>
export type ExitConfirmationRequestInput = z.infer<typeof exitConfirmationRequestSchema>

export const paymentResultSchema = z.object({
  payment_id: z.uuid(),
  receipt_number: z.string(),
  amount_centavos: centavosSchema,
  cash_tendered_centavos: centavosSchema,
  change_centavos: centavosSchema,
  session_status: z.literal('PAID_AWAITING_EXIT'),
})

export type PaymentResult = z.infer<typeof paymentResultSchema>

export const exitConfirmationResultSchema = z.object({
  session_id: z.uuid(),
  exit_time: z.string(),
  status: z.literal('COMPLETED'),
  released_space_id: z.uuid(),
})

export type ExitConfirmationResult = z.infer<typeof exitConfirmationResultSchema>
