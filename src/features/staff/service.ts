import { randomUUID } from 'node:crypto'

import type { ActiveProfile, StaffPermissions } from '@/lib/auth/types'
import type {
  DisableStaffInput,
  InviteStaffInput,
  ReactivateStaffInput,
  UpdateStaffPermissionsInput,
  UpdateStaffRoleInput,
} from '@/features/staff/schemas'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export interface StaffMemberRecord {
  id: string
  full_name: string
  role: 'ADMIN' | 'STAFF'
  is_active: boolean
  disabled_at: string | null
  email: string | null
  permissions: StaffPermissions
}

export interface StaffActionResult {
  success: boolean
  error?: string
  profileId?: string
}

function mapRpcError(error: { message: string } | null): string {
  if (!error) {
    return 'Unable to complete the staff action.'
  }

  const message = error.message.toLowerCase()

  if (message.includes('cannot disable own account')) {
    return 'You cannot disable your own account.'
  }

  if (message.includes('cannot modify own permissions')) {
    return 'You cannot change your own permissions.'
  }

  if (message.includes('cannot modify own role')) {
    return 'You cannot change your own role.'
  }

  if (message.includes('last active admin')) {
    return 'At least one active administrator must remain for this location.'
  }

  if (message.includes('staff target not found')) {
    return 'Staff member was not found in your location.'
  }

  if (message.includes('profile already exists')) {
    return 'That account already has a staff profile.'
  }

  if (message.includes('admin authorization required')) {
    return 'Administrator access is required.'
  }

  return 'Unable to complete the staff action.'
}

async function compensateAuthIdentity(userId: string): Promise<void> {
  const admin = createAdminSupabaseClient()
  const { error } = await admin.auth.admin.deleteUser(userId)

  if (error) {
    console.error('Failed to compensate orphaned auth identity', {
      userId,
      code: error.code,
    })
  }
}

export async function listStaffMembers(
  adminProfile: ActiveProfile,
): Promise<StaffMemberRecord[]> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('profiles')
    .select(
      `
      id,
      full_name,
      role,
      is_active,
      disabled_at,
      staff_permissions!staff_permissions_profile_id_fkey (
        can_approve_overrides,
        can_void_payments,
        can_process_lost_tickets,
        can_correct_session_times,
        can_cancel_sessions
      )
    `,
    )
    .eq('parking_location_id', adminProfile.parking_location_id)
    .order('full_name')

  if (error || !data) {
    return []
  }

  const adminClient = createAdminSupabaseClient()
  const records: StaffMemberRecord[] = []

  for (const row of data) {
    const permissionsRow = Array.isArray(row.staff_permissions)
      ? row.staff_permissions[0]
      : row.staff_permissions

    const { data: authUser } = await adminClient.auth.admin.getUserById(row.id)

    records.push({
      id: row.id,
      full_name: row.full_name,
      role: row.role,
      is_active: row.is_active,
      disabled_at: row.disabled_at,
      email: authUser.user?.email ?? null,
      permissions: {
        can_approve_overrides: permissionsRow?.can_approve_overrides ?? false,
        can_void_payments: permissionsRow?.can_void_payments ?? false,
        can_process_lost_tickets: permissionsRow?.can_process_lost_tickets ?? false,
        can_correct_session_times: permissionsRow?.can_correct_session_times ?? false,
        can_cancel_sessions: permissionsRow?.can_cancel_sessions ?? false,
      },
    })
  }

  return records
}

export async function inviteStaffMember(
  actor: ActiveProfile,
  input: InviteStaffInput,
): Promise<StaffActionResult> {
  const admin = createAdminSupabaseClient()
  const correlationId = randomUUID()

  const { data: createdUser, error: createError } =
    await admin.auth.admin.createUser({
      email: input.email,
      password: input.temporaryPassword,
      email_confirm: true,
    })

  if (createError || !createdUser.user) {
    return {
      success: false,
      error: 'Unable to create the staff account. Verify the email is unique.',
    }
  }

  const userId = createdUser.user.id

  if (actor.id === userId) {
    await compensateAuthIdentity(userId)
    return {
      success: false,
      error: 'You cannot invite yourself through this workflow.',
    }
  }

  const supabase = await createServerSupabaseClient()
  const { error: rpcError } = await supabase.rpc('admin_create_staff_profile', {
    p_user_id: userId,
    p_full_name: input.fullName,
    p_role: input.role,
    p_can_approve_overrides: input.permissions.can_approve_overrides,
    p_can_void_payments: input.permissions.can_void_payments,
    p_can_process_lost_tickets: input.permissions.can_process_lost_tickets,
    p_can_correct_session_times: input.permissions.can_correct_session_times,
    p_can_cancel_sessions: input.permissions.can_cancel_sessions,
    p_correlation_id: correlationId,
  })

  if (rpcError) {
    await compensateAuthIdentity(userId)
    return { success: false, error: mapRpcError(rpcError) }
  }

  return { success: true, profileId: userId }
}

export async function disableStaffMember(
  input: DisableStaffInput,
): Promise<StaffActionResult> {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.rpc('admin_disable_staff', {
    p_target_id: input.targetProfileId,
    p_reason: input.reason,
    p_correlation_id: randomUUID(),
  })

  if (error) {
    return { success: false, error: mapRpcError(error) }
  }

  const admin = createAdminSupabaseClient()
  const { error: revokeError } = await admin.auth.admin.updateUserById(
    input.targetProfileId,
    { ban_duration: '876000h' },
  )

  if (revokeError) {
    console.error('Staff disabled but session revocation failed', {
      profileId: input.targetProfileId,
      code: revokeError.code,
    })
  }

  return { success: true, profileId: input.targetProfileId }
}

export async function reactivateStaffMember(
  input: ReactivateStaffInput,
): Promise<StaffActionResult> {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.rpc('admin_reactivate_staff', {
    p_target_id: input.targetProfileId,
    p_reason: input.reason,
    p_correlation_id: randomUUID(),
  })

  if (error) {
    return { success: false, error: mapRpcError(error) }
  }

  const admin = createAdminSupabaseClient()
  const { error: unbanError } = await admin.auth.admin.updateUserById(
    input.targetProfileId,
    { ban_duration: 'none' },
  )

  if (unbanError) {
    console.error('Staff reactivated but auth ban could not be cleared', {
      profileId: input.targetProfileId,
      code: unbanError.code,
    })
  }

  return { success: true, profileId: input.targetProfileId }
}

export async function updateStaffPermissions(
  input: UpdateStaffPermissionsInput,
): Promise<StaffActionResult> {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.rpc('admin_update_staff_permissions', {
    p_target_id: input.targetProfileId,
    p_can_approve_overrides: input.permissions.can_approve_overrides,
    p_can_void_payments: input.permissions.can_void_payments,
    p_can_process_lost_tickets: input.permissions.can_process_lost_tickets,
    p_can_correct_session_times: input.permissions.can_correct_session_times,
    p_can_cancel_sessions: input.permissions.can_cancel_sessions,
    p_correlation_id: randomUUID(),
  })

  if (error) {
    return { success: false, error: mapRpcError(error) }
  }

  return { success: true, profileId: input.targetProfileId }
}

export async function updateStaffRole(
  input: UpdateStaffRoleInput,
): Promise<StaffActionResult> {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.rpc('admin_update_staff_role', {
    p_target_id: input.targetProfileId,
    p_role: input.role,
    p_correlation_id: randomUUID(),
  })

  if (error) {
    return { success: false, error: mapRpcError(error) }
  }

  return { success: true, profileId: input.targetProfileId }
}
