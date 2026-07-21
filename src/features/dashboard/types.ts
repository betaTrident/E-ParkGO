export type DashboardDomain = 'spaces' | 'sessions' | 'payments'

export interface DashboardMetrics {
  total_capacity: number
  available_spaces: number
  occupied_spaces: number
  out_of_service_spaces: number
  operational_capacity: number
  occupancy_basis_points: number
  active_sessions: number
  payment_pending_sessions: number
  paid_awaiting_exit_sessions: number
  lost_ticket_sessions: number
  manual_review_sessions: number
  entries_today: number
  exits_today: number
  revenue_today_centavos: number
}

export interface DashboardZoneSnapshot {
  zone_id: string
  zone_code: string
  zone_name: string
  total_spaces: number
  available_spaces: number
  occupied_spaces: number
  out_of_service_spaces: number
}

export interface DashboardMovement {
  kind: 'entry' | 'exit'
  occurred_at: string
  session_id: string
  plate_display: string
  space_code: string
  zone_code: string
  session_status: string
}

export interface DashboardSnapshot {
  snapshot_at: string
  business_date: string
  aggregate_version: number
  location_id: string
  timezone: string
  metrics: DashboardMetrics
  zones: DashboardZoneSnapshot[]
  recent_movements: DashboardMovement[]
}

export interface DashboardInvalidatePayload {
  domain: DashboardDomain
  aggregate_version: number
}

export type RealtimeConnectionState =
  | 'idle'
  | 'connecting'
  | 'live'
  | 'reconnecting'
  | 'stale'
  | 'offline'
