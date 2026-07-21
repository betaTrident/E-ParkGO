import { describe, expect, it } from 'vitest'

import {
  containsForbiddenShiftField,
  startShiftRequestSchema,
} from '@/features/shifts/schemas'

describe('shift schema', () => {
  it('accepts valid start shift requests', () => {
    const parsed = startShiftRequestSchema.safeParse({
      opening_float_centavos: '0',
      idempotency_key: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01',
    })

    expect(parsed.success).toBe(true)
  })

  it('rejects unknown fields', () => {
    const parsed = startShiftRequestSchema.safeParse({
      opening_float_centavos: '0',
      idempotency_key: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01',
      location_id: '11111111-1111-4111-8111-111111111111',
    })

    expect(parsed.success).toBe(false)
  })

  it('detects forbidden actor fields', () => {
    expect(containsForbiddenShiftField({ actor_id: 'x' })).toBe(true)
  })
})
