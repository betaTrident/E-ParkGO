import { z } from 'zod'

export const facilitySettingsSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Facility name must be at least 2 characters')
      .max(120, 'Facility name must be at most 120 characters'),
    timezone: z
      .string()
      .trim()
      .min(1, 'Timezone is required')
      .max(64, 'Timezone must be at most 64 characters'),
    receiptPrefix: z
      .string()
      .trim()
      .min(2, 'Receipt prefix must be at least 2 characters')
      .max(16, 'Receipt prefix must be at most 16 characters')
      .regex(/^[A-Z0-9-]+$/, 'Receipt prefix must be uppercase letters, numbers, or hyphens'),
    graceDisplayMinutes: z.coerce
      .number()
      .int('Grace display minutes must be a whole number')
      .min(0, 'Grace display minutes cannot be negative')
      .max(180, 'Grace display minutes cannot exceed 180'),
  })
  .strict()

export type FacilitySettingsInput = z.infer<typeof facilitySettingsSchema>

export const capacitySchema = z
  .object({
    carCapacity: z.coerce
      .number()
      .int('Car capacity must be a whole number')
      .min(0, 'Car capacity cannot be negative'),
    motorcycleCapacity: z.coerce
      .number()
      .int('Motorcycle capacity must be a whole number')
      .min(0, 'Motorcycle capacity cannot be negative'),
  })
  .strict()

export type CapacityInput = z.infer<typeof capacitySchema>

export const forbiddenFacilityFields = [
  'actor_id',
  'actorId',
  'parking_location_id',
  'parkingLocationId',
  'location_id',
  'locationId',
  'id',
] as const

export function containsForbiddenFacilityField(
  input: Record<string, unknown>,
): boolean {
  return forbiddenFacilityFields.some((field) => field in input)
}
