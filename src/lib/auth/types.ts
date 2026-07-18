export type AppRole = 'ADMIN' | 'STAFF'

export type StaffPermissionKey =
  | 'can_approve_overrides'
  | 'can_void_payments'
  | 'can_process_lost_tickets'
  | 'can_correct_session_times'
  | 'can_cancel_sessions'

export interface StaffPermissions {
  can_approve_overrides: boolean
  can_void_payments: boolean
  can_process_lost_tickets: boolean
  can_correct_session_times: boolean
  can_cancel_sessions: boolean
}

export interface ActiveProfile {
  id: string
  parking_location_id: string
  role: AppRole
  full_name: string
  is_active: boolean
  disabled_at: string | null
  permissions: StaffPermissions
}
