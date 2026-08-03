import { NextResponse } from 'next/server'
import { z } from 'zod'

import { fetchDashboardSnapshot } from '@/features/dashboard/service'
import { apiError, apiSuccess } from '@/lib/api/envelope'
import { getSessionUser } from '@/lib/auth/session'

const businessDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .optional()

export async function GET(request: Request) {
  const correlationId = request.headers.get('x-correlation-id') ?? crypto.randomUUID()
  const user = await getSessionUser()

  if (!user) {
    return apiError(
      'AUTHENTICATION_REQUIRED',
      'Sign in is required.',
      401,
      correlationId,
    )
  }

  const url = new URL(request.url)
  const parsedDate = businessDateSchema.safeParse(
    url.searchParams.get('business_date') ?? undefined,
  )

  if (!parsedDate.success) {
    return apiError(
      'VALIDATION_FAILED',
      'business_date must use YYYY-MM-DD format.',
      400,
      correlationId,
    )
  }

  const snapshot = await fetchDashboardSnapshot(parsedDate.data)

  if (!snapshot) {
    return apiError(
      'SERVICE_UNAVAILABLE',
      'Dashboard snapshot is temporarily unavailable.',
      503,
      correlationId,
      { retryable: true },
    )
  }

  return apiSuccess(snapshot, 200, correlationId)
}

// Playwright health probes may use HEAD for connectivity checks.
export async function HEAD() {
  return new NextResponse(null, { status: 204 })
}
