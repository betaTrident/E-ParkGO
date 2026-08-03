import { z } from 'zod'

const forbiddenExceptionFields = [
  'actor_id',
  'actorId',
  'location_id',
  'locationId',
  'parking_location_id',
  'approved_by',
  'status',
] as const

export function containsForbiddenExceptionField(input: Record<string, unknown>): boolean {
  return forbiddenExceptionFields.some((field) => field in input)
}

const reasonSchema = z.string().min(10).max(500)

export const lostTicketRequestSchema = z
  .object({
    evidence: z.record(z.string(), z.string()).refine(
      (value) => Object.keys(value).length > 0,
      'Evidence is required',
    ),
    reason: reasonSchema,
    idempotency_key: z.uuid('Idempotency key is required'),
    correlation_id: z.uuid().optional(),
  })
  .strict()

export const cancelSessionRequestSchema = z
  .object({
    reason: reasonSchema,
    idempotency_key: z.uuid('Idempotency key is required'),
    correlation_id: z.uuid().optional(),
  })
  .strict()

export const correctionRequestSchema = z
  .object({
    correction_type: z.enum([
      'DISCOUNT_PERCENT',
      'COMPLIMENTARY',
      'ADJUSTMENT_CENTAVOS',
      'ENTRY_TIME',
    ]),
    values: z.record(z.string(), z.unknown()),
    reason: reasonSchema,
    idempotency_key: z.uuid('Idempotency key is required'),
    correlation_id: z.uuid().optional(),
  })
  .strict()

export const voidPaymentRequestSchema = z
  .object({
    reason: reasonSchema,
    idempotency_key: z.uuid('Idempotency key is required'),
    correlation_id: z.uuid().optional(),
  })
  .strict()

export type LostTicketRequestInput = z.infer<typeof lostTicketRequestSchema>
export type CancelSessionRequestInput = z.infer<typeof cancelSessionRequestSchema>
export type CorrectionRequestInput = z.infer<typeof correctionRequestSchema>
export type VoidPaymentRequestInput = z.infer<typeof voidPaymentRequestSchema>
