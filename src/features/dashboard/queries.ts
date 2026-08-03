import type { QueryClient } from '@tanstack/react-query'

import type { DashboardSnapshot } from '@/features/dashboard/types'
import { dashboardQueryKeys } from '@/lib/query/keys'

export const dashboardSnapshotQueryOptions = (
  locationId: string,
  businessDate: string | undefined,
  initialData?: DashboardSnapshot,
) => ({
  queryKey: dashboardQueryKeys.snapshot(locationId, businessDate),
  queryFn: async (): Promise<DashboardSnapshot> => {
    const params = new URLSearchParams()
    if (businessDate) {
      params.set('business_date', businessDate)
    }

    const response = await fetch(
      params.size > 0 ? `/api/dashboard?${params.toString()}` : '/api/dashboard',
      {
        method: 'GET',
        credentials: 'same-origin',
        headers: { accept: 'application/json' },
      },
    )

    if (!response.ok) {
      throw new Error('Unable to load dashboard snapshot.')
    }

    const body = (await response.json()) as {
      success: boolean
      data: DashboardSnapshot | null
    }

    if (!body.success || !body.data) {
      throw new Error('Dashboard snapshot response was empty.')
    }

    return body.data
  },
  initialData,
  staleTime: 15_000,
})

export function invalidateDashboardSnapshot(
  queryClient: QueryClient,
  locationId: string,
  businessDate?: string,
) {
  return queryClient.invalidateQueries({
    queryKey: dashboardQueryKeys.snapshot(locationId, businessDate),
  })
}
