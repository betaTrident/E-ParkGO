export interface DashboardTelemetrySnapshot {
  activeSubscriptions: number
  invalidationEvents: number
  reconnectAttempts: number
  canonicalRefetches: number
  lastInvalidationPayloadBytes: number
  lastConvergenceMs: number | null
}

const initialState = (): DashboardTelemetrySnapshot => ({
  activeSubscriptions: 0,
  invalidationEvents: 0,
  reconnectAttempts: 0,
  canonicalRefetches: 0,
  lastInvalidationPayloadBytes: 0,
  lastConvergenceMs: null,
})

let telemetry: DashboardTelemetrySnapshot = initialState()

export function getDashboardTelemetry(): Readonly<DashboardTelemetrySnapshot> {
  return telemetry
}

export function resetDashboardTelemetry(): void {
  telemetry = initialState()
}

export function recordDashboardSubscriptionCount(count: number): void {
  telemetry = { ...telemetry, activeSubscriptions: Math.max(0, count) }
}

export function recordDashboardInvalidation(payload: unknown): void {
  const payloadBytes = new TextEncoder().encode(JSON.stringify(payload)).length
  telemetry = {
    ...telemetry,
    invalidationEvents: telemetry.invalidationEvents + 1,
    lastInvalidationPayloadBytes: payloadBytes,
  }
}

export function recordDashboardReconnectAttempt(): void {
  telemetry = {
    ...telemetry,
    reconnectAttempts: telemetry.reconnectAttempts + 1,
  }
}

export function recordDashboardCanonicalRefetch(durationMs: number): void {
  telemetry = {
    ...telemetry,
    canonicalRefetches: telemetry.canonicalRefetches + 1,
    lastConvergenceMs: durationMs,
  }
}
