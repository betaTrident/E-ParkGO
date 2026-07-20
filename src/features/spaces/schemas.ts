import { z } from 'zod'

const spaceStatusSchema = z.enum(['AVAILABLE', 'OCCUPIED', 'OUT_OF_SERVICE'])

export const spaceFilterSchema = z
  .object({
    zoneId: z.uuid('Select a valid zone').optional(),
    status: spaceStatusSchema.optional(),
  })
  .strict()

export const createSpaceSchema = z
  .object({
    zoneId: z.uuid('Select a valid zone'),
    code: z
      .string()
      .trim()
      .min(1, 'Space code is required')
      .max(32, 'Space code must be at most 32 characters')
      .regex(/^[A-Za-z0-9-]+$/, 'Space code may contain letters, numbers, and hyphens'),
    vehicleTypeId: z.uuid('Select a valid vehicle type'),
  })
  .strict()

export const updateSpaceSchema = z
  .object({
    spaceId: z.uuid('Select a valid space'),
    zoneId: z.uuid('Select a valid zone'),
    vehicleTypeId: z.uuid('Select a valid vehicle type'),
  })
  .strict()

export const spaceStatusUpdateSchema = z
  .object({
    spaceId: z.uuid('Select a valid space'),
    status: z.enum(['AVAILABLE', 'OUT_OF_SERVICE']),
    expectedVersion: z.coerce
      .bigint()
      .refine((value) => value > BigInt(0), 'Expected version must be positive'),
  })
  .strict()

export const createZoneSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(1, 'Zone code is required')
      .max(16, 'Zone code must be at most 16 characters'),
    name: z
      .string()
      .trim()
      .min(1, 'Zone name is required')
      .max(80, 'Zone name must be at most 80 characters'),
    sortOrder: z.coerce.number().int().min(0).max(999),
  })
  .strict()

export const createVehicleTypeSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(1, 'Vehicle type code is required')
      .max(16, 'Vehicle type code must be at most 16 characters'),
    name: z
      .string()
      .trim()
      .min(1, 'Vehicle type name is required')
      .max(80, 'Vehicle type name must be at most 80 characters'),
  })
  .strict()

export type SpaceFilterInput = z.infer<typeof spaceFilterSchema>
export type CreateSpaceInput = z.infer<typeof createSpaceSchema>
export type UpdateSpaceInput = z.infer<typeof updateSpaceSchema>
export type SpaceStatusUpdateInput = z.infer<typeof spaceStatusUpdateSchema>
export type CreateZoneInput = z.infer<typeof createZoneSchema>
export type CreateVehicleTypeInput = z.infer<typeof createVehicleTypeSchema>

export const forbiddenSpaceFields = [
  'actor_id',
  'actorId',
  'parking_location_id',
  'parkingLocationId',
  'location_id',
  'locationId',
  'version',
] as const
