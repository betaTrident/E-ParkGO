import { describe, expect, it } from 'vitest'

import {
  auditSearchSchema,
  reportPreviewSchema,
  transactionQuerySchema,
} from '@/features/reports/schemas'

describe('report schemas', () => {
  it('accepts bounded transaction queries', () => {
    const parsed = transactionQuerySchema.safeParse({
      from: '2026-07-01',
      to: '2026-07-15',
      limit: 50,
    })

    expect(parsed.success).toBe(true)
  })

  it('rejects transaction ranges over 90 days', () => {
    const parsed = transactionQuerySchema.safeParse({
      from: '2026-01-01',
      to: '2026-07-29',
    })

    expect(parsed.success).toBe(false)
  })

  it('rejects unknown report preview fields', () => {
    const parsed = reportPreviewSchema.safeParse({
      type: 'DAILY_REVENUE',
      from: '2026-07-01',
      to: '2026-07-07',
      extra: true,
    })

    expect(parsed.success).toBe(false)
  })

  it('accepts audit search filters', () => {
    const parsed = auditSearchSchema.safeParse({
      from: '2026-07-01T00:00:00+08:00',
      to: '2026-07-07T23:59:59+08:00',
      action: 'REPORT_EXPORT',
    })

    expect(parsed.success).toBe(true)
  })
})
