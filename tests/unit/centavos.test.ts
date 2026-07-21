import { describe, expect, it } from 'vitest'

import {
  centavosToString,
  formatCentavosForDisplay,
  isCentavosString,
  parseCentavosString,
} from '@/lib/money/centavos'

describe('centavos', () => {
  it('accepts canonical nonnegative decimal strings', () => {
    expect(isCentavosString('0')).toBe(true)
    expect(isCentavosString('5000')).toBe(true)
    expect(parseCentavosString('9000')).toBe(BigInt(9000))
  })

  it('rejects signs, decimals, and leading zeros', () => {
    expect(isCentavosString('-1')).toBe(false)
    expect(isCentavosString('12.50')).toBe(false)
    expect(isCentavosString('01')).toBe(false)
    expect(isCentavosString(' 5000')).toBe(false)
  })

  it('round-trips bigint values to canonical strings', () => {
    expect(centavosToString(BigInt(28100))).toBe('28100')
  })

  it('formats centavos for PHP display only', () => {
    expect(formatCentavosForDisplay('5000')).toContain('50.00')
  })

  it('rejects out-of-bounds values', () => {
    expect(() => parseCentavosString('9'.repeat(20))).toThrow()
    expect(() => centavosToString(BigInt(-1))).toThrow()
  })
})
