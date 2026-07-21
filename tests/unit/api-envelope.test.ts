import { describe, expect, it } from 'vitest'

import { apiError, mapRpcError } from '@/lib/api/envelope'

describe('api envelope', () => {
  it('maps known rpc domain errors to stable api codes', async () => {
    const response = mapRpcError({ message: 'ACTIVE_SESSION_EXISTS' }, 'corr-1')
    const body = await response.json()

    expect(response.status).toBe(409)
    expect(body.error?.code).toBe('ACTIVE_SESSION_EXISTS')
  })

  it('maps authentication failures to 401 responses', async () => {
    const response = mapRpcError({ message: 'authentication required' }, 'corr-2')
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body.error?.code).toBe('AUTHENTICATION_REQUIRED')
  })

  it('maps ticket and rate limit domain errors', async () => {
    const invalid = mapRpcError({ message: 'TICKET_INVALID' }, 'corr-4')
    const limited = mapRpcError({ message: 'RATE_LIMITED' }, 'corr-5')
    const invalidBody = await invalid.json()
    const limitedBody = await limited.json()

    expect(invalid.status).toBe(404)
    expect(invalidBody.error?.code).toBe('TICKET_INVALID')
    expect(limited.status).toBe(429)
    expect(limitedBody.error?.code).toBe('RATE_LIMITED')
  })

  it('maps wrong location to indistinguishable ticket invalid response', async () => {
    const response = mapRpcError({ message: 'WRONG_LOCATION' }, 'corr-6')
    const body = await response.json()

    expect(response.status).toBe(404)
    expect(body.error?.code).toBe('TICKET_INVALID')
  })

  it('maps additional ticket lifecycle errors to stable messages', async () => {
    const revokedResponse = mapRpcError({ message: 'TICKET_REVOKED' }, 'corr-7')
    const completedResponse = mapRpcError(
      { message: 'TICKET_ALREADY_COMPLETED' },
      'corr-8',
    )
    const revoked = await revokedResponse.json()
    const completed = await completedResponse.json()

    expect(revoked.error?.message).toContain('no longer valid')
    expect(completed.error?.message).toContain('already been completed')
  })

  it('returns validation field errors when provided', async () => {
    const response = apiError(
      'VALIDATION_FAILED',
      'Request validation failed.',
      400,
      'corr-3',
      { fieldErrors: { plate_number: ['Required'] } },
    )
    const body = await response.json()

    expect(body.error?.field_errors).toEqual({ plate_number: ['Required'] })
  })

  it('maps null rpc errors to retryable internal errors', async () => {
    const response = mapRpcError(null, 'corr-null')
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body.error?.code).toBe('INTERNAL_ERROR')
    expect(body.error?.retryable).toBe(true)
  })

  it('maps phase 8 payment and shift domain errors', async () => {
    const cases = [
      ['QUOTE_EXPIRED', 422, 'QUOTE_EXPIRED'],
      ['INSUFFICIENT_CASH', 422, 'INSUFFICIENT_CASH'],
      ['SHIFT_REQUIRED', 422, 'SHIFT_REQUIRED'],
      ['PAYMENT_ALREADY_RECORDED', 409, 'PAYMENT_ALREADY_RECORDED'],
      ['SESSION_CANCELLED', 409, 'SESSION_CANCELLED'],
      ['DUPLICATE_PAYMENT_REFERENCE', 409, 'DUPLICATE_PAYMENT_REFERENCE'],
      ['PAYMENT_REQUIRED', 422, 'PAYMENT_REQUIRED'],
      ['INVALID_STATUS_TRANSITION', 409, 'INVALID_STATUS_TRANSITION'],
      ['INSUFFICIENT_PERMISSION', 403, 'INSUFFICIENT_PERMISSION'],
    ] as const

    for (const [message, status, code] of cases) {
      const response = mapRpcError({ message }, `corr-${code}`)
      const body = await response.json()
      expect(response.status).toBe(status)
      expect(body.error?.code).toBe(code)
    }
  })

  it('humanizes additional domain-specific messages', async () => {
    const space = await mapRpcError({ message: 'SPACE_NOT_AVAILABLE' }, 'corr-space')
    const rate = await mapRpcError({ message: 'RATE_NOT_CONFIGURED' }, 'corr-rate')
    const conflict = await mapRpcError({ message: 'IDEMPOTENCY_CONFLICT' }, 'corr-conflict')

    expect((await space.json()).error?.message).toContain('not available')
    expect((await rate.json()).error?.message).toContain('published rate')
    expect((await conflict.json()).error?.message).toContain('idempotency key')
  })

  it('falls back to internal errors for unknown rpc messages', async () => {
    const response = mapRpcError({ message: 'SOMETHING_UNEXPECTED' }, 'corr-unknown')
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body.error?.code).toBe('INTERNAL_ERROR')
    expect(body.error?.retryable).toBe(true)
  })
})
