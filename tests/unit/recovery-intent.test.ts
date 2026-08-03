import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  clearRecoveryIntent,
  hasRecoveryIntent,
  RECOVERY_INTENT_COOKIE,
} from '@/lib/auth/recovery-intent'

const deleteMock = vi.fn()
const getMock = vi.fn()

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    get: getMock,
    delete: deleteMock,
  })),
}))

describe('recovery intent cookie helpers', () => {
  beforeEach(() => {
    deleteMock.mockReset()
    getMock.mockReset()
  })

  it('detects when the recovery intent cookie is present', async () => {
    getMock.mockReturnValue({ value: '1' })

    await expect(hasRecoveryIntent()).resolves.toBe(true)
    expect(getMock).toHaveBeenCalledWith(RECOVERY_INTENT_COOKIE)
  })

  it('clears the recovery intent cookie', async () => {
    await clearRecoveryIntent()

    expect(deleteMock).toHaveBeenCalledWith(RECOVERY_INTENT_COOKIE)
  })
})
