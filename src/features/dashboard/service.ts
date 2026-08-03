import type { DashboardMetrics, DashboardSnapshot } from '@/features/dashboard/types'
import { createServerSupabaseClient } from '@/lib/supabase/server'

function asFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

function normalizeMetrics(value: unknown): DashboardMetrics | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const record = value as Record<string, unknown>
  const carCapacity = asFiniteNumber(record.car_capacity)
  const carOccupied = asFiniteNumber(record.car_occupied)
  const motorcycleCapacity = asFiniteNumber(record.motorcycle_capacity)
  const motorcycleOccupied = asFiniteNumber(record.motorcycle_occupied)
  const activeSessions = asFiniteNumber(record.active_sessions)
  const totalCapacity = asFiniteNumber(record.total_capacity)
  const availableSpaces = asFiniteNumber(record.available_spaces)
  const occupiedSpaces = asFiniteNumber(record.occupied_spaces)
  const outOfServiceSpaces = asFiniteNumber(record.out_of_service_spaces)
  const operationalCapacity = asFiniteNumber(record.operational_capacity)
  const occupancyBasisPoints = asFiniteNumber(record.occupancy_basis_points)
  const paymentPending = asFiniteNumber(record.payment_pending_sessions)
  const paidAwaitingExit = asFiniteNumber(record.paid_awaiting_exit_sessions)
  const lostTicket = asFiniteNumber(record.lost_ticket_sessions)
  const manualReview = asFiniteNumber(record.manual_review_sessions)
  const entriesToday = asFiniteNumber(record.entries_today)
  const exitsToday = asFiniteNumber(record.exits_today)
  const revenueToday = asFiniteNumber(record.revenue_today_centavos)

  if (
    carCapacity === null ||
    carOccupied === null ||
    motorcycleCapacity === null ||
    motorcycleOccupied === null ||
    activeSessions === null ||
    totalCapacity === null ||
    availableSpaces === null ||
    occupiedSpaces === null ||
    outOfServiceSpaces === null ||
    operationalCapacity === null ||
    occupancyBasisPoints === null ||
    paymentPending === null ||
    paidAwaitingExit === null ||
    lostTicket === null ||
    manualReview === null ||
    entriesToday === null ||
    exitsToday === null ||
    revenueToday === null
  ) {
    return null
  }

  return {
    total_capacity: totalCapacity,
    available_spaces: availableSpaces,
    occupied_spaces: occupiedSpaces,
    out_of_service_spaces: outOfServiceSpaces,
    operational_capacity: operationalCapacity,
    occupancy_basis_points: occupancyBasisPoints,
    car_capacity: carCapacity,
    car_occupied: carOccupied,
    motorcycle_capacity: motorcycleCapacity,
    motorcycle_occupied: motorcycleOccupied,
    active_sessions: activeSessions,
    payment_pending_sessions: paymentPending,
    paid_awaiting_exit_sessions: paidAwaitingExit,
    lost_ticket_sessions: lostTicket,
    manual_review_sessions: manualReview,
    entries_today: entriesToday,
    exits_today: exitsToday,
    revenue_today_centavos: revenueToday,
  }
}

function normalizeSnapshot(value: unknown): DashboardSnapshot | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const record = value as Record<string, unknown>
  const aggregateVersion = asFiniteNumber(record.aggregate_version)
  const metrics = normalizeMetrics(record.metrics)

  if (
    typeof record.snapshot_at !== 'string' ||
    typeof record.business_date !== 'string' ||
    aggregateVersion === null ||
    typeof record.location_id !== 'string' ||
    typeof record.timezone !== 'string' ||
    !metrics ||
    !Array.isArray(record.zones) ||
    !Array.isArray(record.recent_movements)
  ) {
    return null
  }

  return {
    snapshot_at: record.snapshot_at,
    business_date: record.business_date,
    aggregate_version: aggregateVersion,
    location_id: record.location_id,
    timezone: record.timezone,
    metrics,
    zones: record.zones as DashboardSnapshot['zones'],
    recent_movements: record.recent_movements as DashboardSnapshot['recent_movements'],
  }
}

function parseRpcPayload(data: unknown): unknown {
  if (typeof data !== 'string') {
    return data
  }

  try {
    return JSON.parse(data) as unknown
  } catch {
    return null
  }
}

export async function fetchDashboardSnapshot(
  businessDate?: string,
): Promise<DashboardSnapshot | null> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.rpc('get_dashboard_snapshot', {
    ...(businessDate ? { p_business_date: businessDate } : {}),
  })

  if (error || !data) {
    console.error('Dashboard snapshot RPC failed', { code: error?.code })
    return null
  }

  const payload = parseRpcPayload(data)
  const snapshot = normalizeSnapshot(payload)
  if (!snapshot) {
    const record =
      payload && typeof payload === 'object'
        ? (payload as Record<string, unknown>)
        : null
    const metrics =
      record?.metrics && typeof record.metrics === 'object'
        ? (record.metrics as Record<string, unknown>)
        : null
    console.error('Dashboard snapshot RPC returned unexpected shape', {
      topKeys: record ? Object.keys(record) : null,
      metricKeys: metrics ? Object.keys(metrics) : null,
      aggregateVersionType: record ? typeof record.aggregate_version : null,
      businessDateType: record ? typeof record.business_date : null,
    })
    return null
  }

  return snapshot
}
