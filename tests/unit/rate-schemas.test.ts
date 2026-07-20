import { describe, expect, it } from 'vitest'

import {
  centavosToString,
  formatCentavosPhp,
  isCanonicalCentavosString,
  parseCentavosString,
} from '@/lib/money/centavos'
import {
  forbiddenRateFields,
  rateDraftSchema,
  rateDraftToRpcPayload,
  rateRecordCentavosToStrings,
} from '@/features/rates/schemas'

describe('centavos helpers', () => {
  it('accepts canonical nonnegative decimal strings', () => {
    expect(isCanonicalCentavosString('0')).toBe(true)
    expect(isCanonicalCentavosString('5000')).toBe(true)
    expect(parseCentavosString('5000')).toBe(BigInt(5000))
    expect(centavosToString(BigInt(5000))).toBe('5000')
  })

  it('rejects signed, decimal, and leading-junk centavos strings', () => {
    expect(isCanonicalCentavosString('-1')).toBe(false)
    expect(isCanonicalCentavosString('12.34')).toBe(false)
    expect(isCanonicalCentavosString(' 5000')).toBe(false)
    expect(isCanonicalCentavosString('5000a')).toBe(false)
    expect(() => parseCentavosString('-1')).toThrow('Invalid centavos amount')
    expect(() => centavosToString(BigInt(-1))).toThrow('Centavos amount out of bounds')
  })

  it('formats PHP currency for display', () => {
    expect(formatCentavosPhp('5000')).toContain('50')
  })
})

describe('rate draft schema', () => {
  it('accepts a tiered draft with decimal-string centavos', () => {
    const parsed = rateDraftSchema.safeParse({
      vehicleTypeId: '33333333-3333-4333-8333-333333333331',
      mode: 'TIERED',
      graceMinutes: 15,
      initialMinutes: 180,
      initialFeeCentavos: '5000',
      succeedingIntervalMinutes: 60,
      succeedingFeeCentavos: '2000',
      dailyMaxCentavos: '30000',
      overnightFeeCentavos: '5000',
      lostTicketPenaltyCentavos: '20000',
      effectiveFrom: '2026-08-01T00:00:00+08:00',
    })

    expect(parsed.success).toBe(true)
  })

  it('accepts a flat draft and maps RPC payload numbers', () => {
    const parsed = rateDraftSchema.safeParse({
      vehicleTypeId: '33333333-3333-4333-8333-333333333331',
      mode: 'FLAT',
      graceMinutes: 15,
      flatFeeCentavos: '5000',
      overnightFeeCentavos: '0',
      lostTicketPenaltyCentavos: '10000',
      effectiveFrom: '2026-08-01T00:00:00+08:00',
    })

    expect(parsed.success).toBe(true)

    if (parsed.success) {
      const payload = rateDraftToRpcPayload(parsed.data)
      expect(payload.p_flat_fee_centavos).toBe(5000)
      expect(payload.p_initial_minutes).toBeNull()
    }
  })

  it('rejects flat drafts without flat fee centavos', () => {
    const parsed = rateDraftSchema.safeParse({
      vehicleTypeId: '33333333-3333-4333-8333-333333333331',
      mode: 'FLAT',
      graceMinutes: 15,
      overnightFeeCentavos: '0',
      lostTicketPenaltyCentavos: '10000',
      effectiveFrom: '2026-08-01T00:00:00+08:00',
    })

    expect(parsed.success).toBe(false)
  })

  it('rejects tiered drafts missing required fields', () => {
    const parsed = rateDraftSchema.safeParse({
      vehicleTypeId: '33333333-3333-4333-8333-333333333331',
      mode: 'TIERED',
      graceMinutes: 15,
      overnightFeeCentavos: '0',
      lostTicketPenaltyCentavos: '10000',
      effectiveFrom: '2026-08-01T00:00:00+08:00',
    })

    expect(parsed.success).toBe(false)
  })

  it('converts stored rate centavos numbers to canonical strings', () => {
    const mapped = rateRecordCentavosToStrings({
      flat_fee_centavos: 5000,
      overnight_fee_centavos: 0,
      lost_ticket_penalty_centavos: 10000,
      initial_fee_centavos: null,
    })

    expect(mapped.flat_fee_centavos).toBe('5000')
    expect(mapped.initial_fee_centavos).toBeNull()
  })

  it('lists forbidden client-supplied rate fields', () => {
    expect(forbiddenRateFields).toContain('parking_location_id')
    expect(forbiddenRateFields).toContain('is_published')
  })
})
