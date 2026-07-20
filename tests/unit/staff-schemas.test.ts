import { describe, expect, it } from 'vitest'

import {
  containsForbiddenStaffField,
  disableStaffSchema,
  forbiddenStaffFields,
  inviteStaffSchema,
  parseStaffRole,
  reactivateStaffSchema,
  updateStaffPermissionsSchema,
  updateStaffRoleSchema,
} from '@/features/staff/schemas'

describe('staff schemas', () => {
  it('rejects unknown invite fields that could escalate privileges', () => {
    const parsed = inviteStaffSchema.safeParse({
      email: 'staff@example.com',
      fullName: 'New Staff',
      role: 'STAFF',
      temporaryPassword: 'TempPass123!@#',
      permissions: {
        can_approve_overrides: false,
        can_void_payments: false,
        can_process_lost_tickets: false,
        can_correct_session_times: false,
        can_cancel_sessions: false,
      },
      actor_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    })

    expect(parsed.success).toBe(false)
  })

  it('rejects invalid emails and weak temporary passwords', () => {
    const parsed = inviteStaffSchema.safeParse({
      email: 'not-an-email',
      fullName: 'New Staff',
      role: 'STAFF',
      temporaryPassword: 'short',
      permissions: {
        can_approve_overrides: false,
        can_void_payments: false,
        can_process_lost_tickets: false,
        can_correct_session_times: false,
        can_cancel_sessions: false,
      },
    })

    expect(parsed.success).toBe(false)
  })

  it('accepts a valid invite payload', () => {
    const parsed = inviteStaffSchema.safeParse({
      email: 'staff@example.com',
      fullName: 'New Staff',
      role: 'ADMIN',
      temporaryPassword: 'TempPass123!@#',
      permissions: {
        can_approve_overrides: true,
        can_void_payments: false,
        can_process_lost_tickets: false,
        can_correct_session_times: false,
        can_cancel_sessions: false,
      },
    })

    expect(parsed.success).toBe(true)
  })

  it('requires a reason for disable and reactivate actions', () => {
    expect(
      disableStaffSchema.safeParse({
        targetProfileId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        reason: 'x',
      }).success,
    ).toBe(false)

    expect(
      reactivateStaffSchema.safeParse({
        targetProfileId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        reason: 'Returning from leave',
      }).success,
    ).toBe(true)
  })

  it('rejects client-supplied location or actor fields', () => {
    const payload = {
      targetProfileId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      permissions: {
        can_approve_overrides: true,
        can_void_payments: false,
        can_process_lost_tickets: false,
        can_correct_session_times: false,
        can_cancel_sessions: false,
      },
      parking_location_id: '11111111-1111-4111-8111-111111111111',
    }

    expect(containsForbiddenStaffField(payload)).toBe(true)
    expect(updateStaffPermissionsSchema.safeParse(payload).success).toBe(false)
    expect(updateStaffRoleSchema.safeParse(payload).success).toBe(false)
  })

  it('parses supported roles and rejects unknown values', () => {
    expect(parseStaffRole('ADMIN')).toBe('ADMIN')
    expect(parseStaffRole('SUPERADMIN')).toBeNull()
  })

  it('documents the forbidden escalation fields', () => {
    expect(forbiddenStaffFields).toContain('parking_location_id')
    expect(forbiddenStaffFields).toContain('actor_id')
  })
})
