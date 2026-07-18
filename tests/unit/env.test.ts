import { describe, expect, it } from 'vitest'

import { env, getServerEnv } from '@/lib/env'
import { hasStaffPermission, normalizeStaffPermissions } from '@/lib/auth/permissions'

describe('env validation', () => {
  it('parses required browser environment variables', () => {
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toMatch(/^https?:\/\//)
    expect(env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length).toBeGreaterThan(0)
    expect(env.NEXT_PUBLIC_APP_URL).toMatch(/^https?:\/\//)
  })

  it('parses required server environment variables', () => {
    const serverEnv = getServerEnv()
    expect(serverEnv.SUPABASE_SERVICE_ROLE_KEY.length).toBeGreaterThan(0)
    expect(serverEnv.RECEIPT_SIGNING_SECRET.length).toBeGreaterThanOrEqual(32)
    expect(['development', 'staging', 'production']).toContain(serverEnv.APP_ENV)
  })
})

describe('staff permissions', () => {
  it('defaults missing permission rows to false', () => {
    expect(normalizeStaffPermissions(null)).toEqual({
      can_approve_overrides: false,
      can_void_payments: false,
      can_process_lost_tickets: false,
      can_correct_session_times: false,
      can_cancel_sessions: false,
    })
  })

  it('checks named permissions', () => {
    const permissions = normalizeStaffPermissions({
      can_void_payments: true,
    })

    expect(hasStaffPermission(permissions, 'can_void_payments')).toBe(true)
    expect(hasStaffPermission(permissions, 'can_cancel_sessions')).toBe(false)
  })
})
