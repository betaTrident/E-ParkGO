import { z } from 'zod'

import type { AppRole, StaffPermissionKey } from '@/lib/auth/types'

const staffPermissionKeys = [
  'can_approve_overrides',
  'can_void_payments',
  'can_process_lost_tickets',
  'can_correct_session_times',
  'can_cancel_sessions',
] as const satisfies readonly StaffPermissionKey[]

const staffPermissionsSchema = z.object({
  can_approve_overrides: z.boolean(),
  can_void_payments: z.boolean(),
  can_process_lost_tickets: z.boolean(),
  can_correct_session_times: z.boolean(),
  can_cancel_sessions: z.boolean(),
})

const appRoleSchema = z.enum(['ADMIN', 'STAFF'])

export const inviteStaffSchema = z
  .object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .pipe(z.email('Enter a valid email address')),
    fullName: z
      .string()
      .trim()
      .min(2, 'Full name must be at least 2 characters')
      .max(120, 'Full name must be at most 120 characters'),
    role: appRoleSchema,
    permissions: staffPermissionsSchema,
    temporaryPassword: z
      .string()
      .min(12, 'Temporary password must be at least 12 characters')
      .max(128, 'Temporary password must be at most 128 characters')
      .regex(/[a-z]/, 'Temporary password must include a lowercase letter')
      .regex(/[A-Z]/, 'Temporary password must include an uppercase letter')
      .regex(/[0-9]/, 'Temporary password must include a number')
      .regex(/[^A-Za-z0-9]/, 'Temporary password must include a symbol'),
  })
  .strict()

export const disableStaffSchema = z
  .object({
    targetProfileId: z.uuid('Select a valid staff member'),
    reason: z
      .string()
      .trim()
      .min(3, 'Reason must be at least 3 characters')
      .max(500, 'Reason must be at most 500 characters'),
  })
  .strict()

export const reactivateStaffSchema = disableStaffSchema

export const updateStaffPermissionsSchema = z
  .object({
    targetProfileId: z.uuid('Select a valid staff member'),
    permissions: staffPermissionsSchema,
  })
  .strict()

export const updateStaffRoleSchema = z
  .object({
    targetProfileId: z.uuid('Select a valid staff member'),
    role: appRoleSchema,
  })
  .strict()

export type InviteStaffInput = z.infer<typeof inviteStaffSchema>
export type DisableStaffInput = z.infer<typeof disableStaffSchema>
export type ReactivateStaffInput = z.infer<typeof reactivateStaffSchema>
export type UpdateStaffPermissionsInput = z.infer<typeof updateStaffPermissionsSchema>
export type UpdateStaffRoleInput = z.infer<typeof updateStaffRoleSchema>

export function parseStaffRole(value: unknown): AppRole | null {
  const parsed = appRoleSchema.safeParse(value)
  return parsed.success ? parsed.data : null
}

export const forbiddenStaffFields = [
  'actor_id',
  'actorId',
  'parking_location_id',
  'parkingLocationId',
  'location_id',
  'locationId',
  'updated_by',
  'updatedBy',
  'id',
  'profile_id',
  'profileId',
] as const

export function containsForbiddenStaffField(input: Record<string, unknown>): boolean {
  return forbiddenStaffFields.some((field) => field in input)
}

export { staffPermissionKeys, staffPermissionsSchema, appRoleSchema }
