import { z } from 'zod'

import { isCentavosString } from '@/lib/money/centavos'

const forbiddenShiftFields = [
  'actor_id',
  'actorId',
  'location_id',
  'locationId',
  'parking_location_id',
  'profile_id',
  'status',
] as const

export function containsForbiddenShiftField(input: Record<string, unknown>): boolean {
  return forbiddenShiftFields.some((field) => field in input)
}

const centavosSchema = z
  .string()
  .refine(isCentavosString, 'Amount must be a nonnegative integer centavos string')

export const startShiftRequestSchema = z
  .object({
    device_id: z.uuid().nullable().optional(),
    opening_float_centavos: centavosSchema,
    idempotency_key: z.uuid('Idempotency key is required'),
    correlation_id: z.uuid().optional(),
  })
  .strict()

export const closeShiftRequestSchema = z
  .object({
    shift_id: z.uuid('Shift id is required'),
    declared_cash_centavos: centavosSchema,
    notes: z.string().max(500).optional(),
    idempotency_key: z.uuid('Idempotency key is required'),
    correlation_id: z.uuid().optional(),
  })
  .strict()

export type StartShiftRequestInput = z.infer<typeof startShiftRequestSchema>
export type CloseShiftRequestInput = z.infer<typeof closeShiftRequestSchema>
