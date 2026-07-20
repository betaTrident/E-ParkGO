import { z } from 'zod'

import {
  centavosToString,
  isCanonicalCentavosString,
  parseCentavosString,
} from '@/lib/money/centavos'

const centavosSchema = z
  .string()
  .trim()
  .refine(isCanonicalCentavosString, 'Amount must be a nonnegative integer string')

const optionalCentavosSchema = centavosSchema.optional()

const rateModeSchema = z.enum(['FLAT', 'TIERED'])

const rateDraftBaseSchema = z
  .object({
    vehicleTypeId: z.uuid('Select a valid vehicle type'),
    mode: rateModeSchema,
    graceMinutes: z.coerce
      .number()
      .int()
      .min(0, 'Grace minutes cannot be negative')
      .max(24 * 60, 'Grace minutes is too large'),
    initialMinutes: z.coerce.number().int().positive().optional(),
    initialFeeCentavos: optionalCentavosSchema,
    succeedingIntervalMinutes: z.coerce.number().int().positive().optional(),
    succeedingFeeCentavos: optionalCentavosSchema,
    flatFeeCentavos: optionalCentavosSchema,
    dailyMaxCentavos: optionalCentavosSchema,
    overnightFeeCentavos: centavosSchema,
    lostTicketPenaltyCentavos: centavosSchema,
    effectiveFrom: z.iso.datetime({ offset: true, message: 'Enter a valid effective date' }),
    effectiveTo: z.iso.datetime({ offset: true }).optional(),
  })
  .strict()

function validateRateModeFields(
  value: z.infer<typeof rateDraftBaseSchema>,
  ctx: z.RefinementCtx,
): void {
  if (value.mode === 'FLAT') {
    if (!value.flatFeeCentavos) {
      ctx.addIssue({
        code: 'custom',
        message: 'Flat fee is required for flat rates',
        path: ['flatFeeCentavos'],
      })
    }
    return
  }

  if (
    !value.initialMinutes ||
    !value.initialFeeCentavos ||
    !value.succeedingIntervalMinutes ||
    !value.succeedingFeeCentavos
  ) {
    ctx.addIssue({
      code: 'custom',
      message: 'Tiered rates require initial and succeeding fields',
      path: ['mode'],
    })
  }
}

export const rateDraftSchema = rateDraftBaseSchema.superRefine(validateRateModeFields)

export const rateDraftUpdateSchema = rateDraftBaseSchema
  .extend({
    rateId: z.uuid('Select a valid rate draft'),
  })
  .strict()
  .superRefine(validateRateModeFields)

export const publishRateSchema = z
  .object({
    rateId: z.uuid('Select a valid rate draft'),
  })
  .strict()

export const retireRateSchema = z
  .object({
    rateId: z.uuid('Select a valid published rate'),
    effectiveTo: z.iso.datetime({ offset: true, message: 'Enter a valid retirement date' }),
  })
  .strict()

export type RateDraftInput = z.infer<typeof rateDraftSchema>
export type RateDraftUpdateInput = z.infer<typeof rateDraftUpdateSchema>
export type PublishRateInput = z.infer<typeof publishRateSchema>
export type RetireRateInput = z.infer<typeof retireRateSchema>

export const forbiddenRateFields = [
  'actor_id',
  'actorId',
  'parking_location_id',
  'parkingLocationId',
  'location_id',
  'locationId',
  'created_by',
  'createdBy',
  'is_published',
  'isPublished',
  'version',
] as const

export function rateDraftToRpcPayload(input: RateDraftInput | RateDraftUpdateInput) {
  return {
    p_vehicle_type_id: input.vehicleTypeId,
    p_mode: input.mode,
    p_grace_minutes: input.graceMinutes,
    p_initial_minutes: input.initialMinutes ?? null,
    p_initial_fee_centavos: input.initialFeeCentavos
      ? Number(parseCentavosString(input.initialFeeCentavos))
      : null,
    p_succeeding_interval_minutes: input.succeedingIntervalMinutes ?? null,
    p_succeeding_fee_centavos: input.succeedingFeeCentavos
      ? Number(parseCentavosString(input.succeedingFeeCentavos))
      : null,
    p_flat_fee_centavos: input.flatFeeCentavos
      ? Number(parseCentavosString(input.flatFeeCentavos))
      : null,
    p_daily_max_centavos: input.dailyMaxCentavos
      ? Number(parseCentavosString(input.dailyMaxCentavos))
      : null,
    p_overnight_fee_centavos: Number(parseCentavosString(input.overnightFeeCentavos)),
    p_lost_ticket_penalty_centavos: Number(
      parseCentavosString(input.lostTicketPenaltyCentavos),
    ),
    p_effective_from: input.effectiveFrom,
    p_effective_to: input.effectiveTo ?? null,
  }
}

export function rateRecordCentavosToStrings<T extends Record<string, unknown>>(record: T) {
  const centavosFields = [
    'initial_fee_centavos',
    'succeeding_fee_centavos',
    'flat_fee_centavos',
    'daily_max_centavos',
    'overnight_fee_centavos',
    'lost_ticket_penalty_centavos',
  ] as const

  const mapped: Record<string, unknown> = { ...record }

  for (const field of centavosFields) {
    const value = record[field]
    if (value === null || value === undefined) {
      mapped[field] = null
    } else if (typeof value === 'number') {
      mapped[field] = centavosToString(BigInt(value))
    } else if (typeof value === 'string') {
      mapped[field] = value
    }
  }

  return mapped
}
