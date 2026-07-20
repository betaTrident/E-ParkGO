import { describe, expect, it } from 'vitest'

import {
  containsForbiddenFacilityField,
  facilitySettingsSchema,
} from '@/features/facility/schemas'
import {
  createSpaceSchema,
  createZoneSchema,
  spaceStatusUpdateSchema,
} from '@/features/spaces/schemas'

describe('facility schemas', () => {
  it('accepts valid facility settings', () => {
    const parsed = facilitySettingsSchema.safeParse({
      name: 'E-ParkGO Pilot Facility',
      timezone: 'Asia/Manila',
      receiptPrefix: 'EPG',
      graceDisplayMinutes: 15,
    })

    expect(parsed.success).toBe(true)
  })

  it('rejects unknown fields', () => {
    const parsed = facilitySettingsSchema.safeParse({
      name: 'Facility',
      timezone: 'Asia/Manila',
      receiptPrefix: 'EPG',
      graceDisplayMinutes: 15,
      parkingLocationId: '11111111-1111-4111-8111-111111111111',
    })

    expect(parsed.success).toBe(false)
  })

  it('detects forbidden actor and location fields', () => {
    expect(
      containsForbiddenFacilityField({
        actorId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      }),
    ).toBe(true)
  })
})

describe('space schemas', () => {
  it('accepts a valid space create payload', () => {
    const parsed = createSpaceSchema.safeParse({
      zoneId: '22222222-2222-4222-8222-222222222221',
      code: 'C-01',
      vehicleTypeId: '33333333-3333-4333-8333-333333333331',
    })

    expect(parsed.success).toBe(true)
  })

  it('rejects invalid zone UUIDs', () => {
    const parsed = createZoneSchema.safeParse({
      code: 'C',
      name: 'Zone C',
      sortOrder: 1,
      locationId: 'invalid',
    })

    expect(parsed.success).toBe(false)
  })

  it('requires positive expected version for status updates', () => {
    const parsed = spaceStatusUpdateSchema.safeParse({
      spaceId: '44444444-4444-4444-8444-444444444441',
      status: 'OUT_OF_SERVICE',
      expectedVersion: 0,
    })

    expect(parsed.success).toBe(false)
  })
})
