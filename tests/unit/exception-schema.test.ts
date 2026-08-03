import { describe, expect, it } from 'vitest'

import {
  cancelSessionRequestSchema,
  containsForbiddenExceptionField,
} from '@/features/sessions/schemas'

describe('exception schema', () => {
  it('requires bounded cancellation reasons', () => {
    const parsed = cancelSessionRequestSchema.safeParse({
      reason: 'short',
      idempotency_key: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01',
    })

    expect(parsed.success).toBe(false)
  })

  it('accepts valid cancellation requests', () => {
    const parsed = cancelSessionRequestSchema.safeParse({
      reason: 'Customer left before entry completed.',
      idempotency_key: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01',
    })

    expect(parsed.success).toBe(true)
  })

  it('rejects forbidden approver fields', () => {
    expect(containsForbiddenExceptionField({ approved_by: 'x' })).toBe(true)
  })

  it('detects forbidden evidence tampering fields', () => {
    expect(containsForbiddenExceptionField({ actor_id: 'x' })).toBe(true)
    expect(containsForbiddenExceptionField({ reason: 'valid reason text' })).toBe(false)
  })
})
