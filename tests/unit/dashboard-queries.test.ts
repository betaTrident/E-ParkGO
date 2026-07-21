import { QueryClient } from '@tanstack/react-query'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  dashboardSnapshotQueryOptions,
  invalidateDashboardSnapshot,
} from '@/features/dashboard/queries'
import type { DashboardSnapshot } from '@/features/dashboard/types'
import { dashboardQueryKeys } from '@/lib/query/keys'

const snapshot: DashboardSnapshot = {
  snapshot_at: '2026-07-21T10:00:00.000Z',
  business_date: '2026-07-21',
  aggregate_version: 2,
  location_id: '11111111-1111-4111-8111-111111111111',
  timezone: 'Asia/Manila',
  metrics: {
    total_capacity: 4,
    available_spaces: 3,
    occupied_spaces: 1,
    out_of_service_spaces: 0,
    operational_capacity: 4,
    occupancy_basis_points: 2500,
    active_sessions: 1,
    payment_pending_sessions: 0,
    paid_awaiting_exit_sessions: 0,
    lost_ticket_sessions: 0,
    manual_review_sessions: 0,
    entries_today: 1,
    exits_today: 0,
    revenue_today_centavos: 5000,
  },
  zones: [],
  recent_movements: [],
}

describe('dashboard queries', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('loads snapshots with and without business date filters', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: snapshot }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const withDate = dashboardSnapshotQueryOptions(
      snapshot.location_id,
      snapshot.business_date,
    )
    const withoutDate = dashboardSnapshotQueryOptions(snapshot.location_id, undefined)

    await expect(withDate.queryFn()).resolves.toEqual(snapshot)
    await expect(withoutDate.queryFn()).resolves.toEqual(snapshot)

    expect(fetchMock).toHaveBeenCalledWith(
      `/api/dashboard?business_date=${snapshot.business_date}`,
      expect.objectContaining({ method: 'GET' }),
    )
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/dashboard',
      expect.objectContaining({ method: 'GET' }),
    )
  })

  it('rejects failed and empty dashboard responses', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, json: async () => ({}) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: false, data: null }),
      })
    vi.stubGlobal('fetch', fetchMock)

    const options = dashboardSnapshotQueryOptions(snapshot.location_id, undefined)

    await expect(options.queryFn()).rejects.toThrow('Unable to load dashboard snapshot.')
    await expect(options.queryFn()).rejects.toThrow('Dashboard snapshot response was empty.')
  })

  it('invalidates snapshot query keys', async () => {
    const queryClient = new QueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    await invalidateDashboardSnapshot(queryClient, snapshot.location_id, snapshot.business_date)

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: dashboardQueryKeys.snapshot(snapshot.location_id, snapshot.business_date),
    })
  })
})
