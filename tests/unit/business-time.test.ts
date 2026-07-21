import { describe, expect, it } from 'vitest'

import {
  formatBusinessDateTime,
  formatQuoteExpiry,
  toBusinessZonedTime,
} from '@/lib/time/business-time'

describe('business-time', () => {
  it('formats instants in Asia/Manila', () => {
    const formatted = formatBusinessDateTime('2026-07-21T10:00:00.000Z')
    expect(formatted).toContain('2026')
  })

  it('formats quote expiry labels', () => {
    const formatted = formatQuoteExpiry('2026-07-21T12:15:00.000Z')
    expect(formatted).toMatch(/on/)
  })

  it('converts instants to business zoned time', () => {
    const zoned = toBusinessZonedTime('2026-07-21T10:00:00.000Z')
    expect(zoned).toBeInstanceOf(Date)
  })
})
