import { describe, expect, it } from 'vitest'

import {
  containsForbiddenEntryField,
  entryRequestSchema,
  normalizePlateNumber,
} from '@/features/entry/schemas'

describe('entry schema', () => {
  it('normalizes plate numbers to uppercase alphanumeric', () => {
    expect(normalizePlateNumber(' ab-12 34 ')).toBe('AB1234')
  })

  it('accepts valid entry requests', () => {
    const parsed = entryRequestSchema.safeParse({
      plate_number: 'abc-1234',
      vehicle_type_id: '33333333-3333-4333-8333-333333333331',
      color: 'Blue',
      parking_space_id: '44444444-4444-4444-8444-444444444441',
      idempotency_key: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01',
      correlation_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb01',
    })

    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.plate_number).toBe('ABC1234')
    }
  })

  it('rejects unknown fields', () => {
    const parsed = entryRequestSchema.safeParse({
      plate_number: 'ABC1234',
      vehicle_type_id: '33333333-3333-4333-8333-333333333331',
      parking_space_id: '44444444-4444-4444-8444-444444444441',
      idempotency_key: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01',
      actor_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    })

    expect(parsed.success).toBe(false)
  })

  it('detects forbidden actor and location fields', () => {
    expect(
      containsForbiddenEntryField({
        entry_time: '2026-07-21T00:00:00.000Z',
      }),
    ).toBe(true)
  })
})
