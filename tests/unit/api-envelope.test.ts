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
})
