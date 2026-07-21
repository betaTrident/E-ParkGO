import { describe, expect, it } from 'vitest'

import {
  containsForbiddenPaymentField,
  paymentRequestSchema,
} from '@/features/payments/schemas'

describe('payment schema', () => {
  it('accepts valid payment requests', () => {
    const parsed = paymentRequestSchema.safeParse({
      session_id: '11111111-1111-4111-8111-111111111111',
      cash_tendered_centavos: '10000',
      idempotency_key: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01',
    })

    expect(parsed.success).toBe(true)
  })

  it('rejects decimal tender strings', () => {
    const parsed = paymentRequestSchema.safeParse({
      session_id: '11111111-1111-4111-8111-111111111111',
      cash_tendered_centavos: '10.50',
      idempotency_key: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01',
    })

    expect(parsed.success).toBe(false)
  })

  it('rejects forbidden client totals', () => {
    expect(containsForbiddenPaymentField({ total_centavos: '5000' })).toBe(true)
  })
})
