import { normalizeStaffPermissions } from '@/lib/auth/permissions'
import type { ActiveProfile, StaffPermissions } from '@/lib/auth/types'
import { createServerSupabaseClient } from '@/lib/supabase/server'

interface ProfileRow {
  id: string
  parking_location_id: string
  role: 'ADMIN' | 'STAFF'
  full_name: string
  is_active: boolean
  disabled_at: string | null
  staff_permissions: StaffPermissions | StaffPermissions[] | null
}

function extractPermissions(
  value: StaffPermissions | StaffPermissions[] | null,
): StaffPermissions | null {
  if (!value) {
    return null
  }

  if (Array.isArray(value)) {
    return value[0] ?? null
  }

  return value
}

export async function getActiveProfile(): Promise<ActiveProfile | null> {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return null
  }

  const { data, error } = await supabase
    .from('profiles')
    .select(
      `
      id,
      parking_location_id,
      role,
      full_name,
      is_active,
      disabled_at,
      staff_permissions (
        can_approve_overrides,
        can_void_payments,
        can_process_lost_tickets,
        can_correct_session_times,
        can_cancel_sessions
      )
    `,
    )
    .eq('id', user.id)
    .maybeSingle()

  if (error || !data) {
    return null
  }

  const profile = data as ProfileRow

  if (!profile.is_active || profile.disabled_at) {
    return null
  }

  return {
    id: profile.id,
    parking_location_id: profile.parking_location_id,
    role: profile.role,
    full_name: profile.full_name,
    is_active: profile.is_active,
    disabled_at: profile.disabled_at,
    permissions: normalizeStaffPermissions(extractPermissions(profile.staff_permissions)),
  }
}
