import { z } from 'zod'

const forbiddenEntryFields = [
  'actor_id',
  'actorId',
  'location_id',
  'locationId',
  'parking_location_id',
  'entry_time',
  'entryTime',
  'total_centavos',
  'totalCentavos',
  'status',
  'session_id',
  'sessionId',
] as const

export function containsForbiddenEntryField(input: Record<string, unknown>): boolean {
  return forbiddenEntryFields.some((field) => field in input)
}

export function normalizePlateNumber(plate: string): string {
  return plate.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
}

const plateSchema = z
  .string()
  .trim()
  .min(2, 'Plate number must be at least 2 characters')
  .max(16, 'Plate number is too long')
  .transform(normalizePlateNumber)
  .refine((value) => /^[A-Z0-9]{2,12}$/.test(value), 'Enter a valid plate number')

export const entryRequestSchema = z
  .object({
    plate_number: plateSchema,
    vehicle_type_id: z.uuid('Select a valid vehicle type'),
    color: z.string().trim().max(40, 'Color is too long').optional(),
    parking_space_id: z.uuid('Select a valid parking space'),
    idempotency_key: z.uuid('Idempotency key is required'),
    correlation_id: z.uuid('Correlation id is required').optional(),
  })
  .strict()

export type EntryRequestInput = z.infer<typeof entryRequestSchema>

export const entryFormSchema = z
  .object({
    plateNumber: plateSchema,
    vehicleTypeId: z.uuid('Select a vehicle type'),
    color: z.string().trim().max(40, 'Color is too long').optional(),
    parkingSpaceId: z.uuid('Select a parking space'),
  })
  .strict()

export type EntryFormInput = z.infer<typeof entryFormSchema>
