import type { StaffPermissionKey, StaffPermissions } from '@/lib/auth/types'

const DEFAULT_PERMISSIONS: StaffPermissions = {
  can_approve_overrides: false,
  can_void_payments: false,
  can_process_lost_tickets: false,
  can_correct_session_times: false,
  can_cancel_sessions: false,
}

export function normalizeStaffPermissions(
  row: Partial<StaffPermissions> | null | undefined,
): StaffPermissions {
  if (!row) {
    return { ...DEFAULT_PERMISSIONS }
  }

  return {
    can_approve_overrides: row.can_approve_overrides ?? false,
    can_void_payments: row.can_void_payments ?? false,
    can_process_lost_tickets: row.can_process_lost_tickets ?? false,
    can_correct_session_times: row.can_correct_session_times ?? false,
    can_cancel_sessions: row.can_cancel_sessions ?? false,
  }
}

export function hasStaffPermission(
  permissions: StaffPermissions,
  permission: StaffPermissionKey,
): boolean {
  return permissions[permission]
}
