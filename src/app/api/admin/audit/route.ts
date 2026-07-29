import { NextResponse } from 'next/server'

import { searchAuditLogs } from '@/features/reports/service'
import { auditSearchSchema } from '@/features/reports/schemas'
import { apiError, apiSuccess } from '@/lib/api/envelope'
import { getActiveProfile } from '@/lib/auth/profile'
import { getSessionUser } from '@/lib/auth/session'

export async function GET(request: Request) {
  const correlationId = request.headers.get('x-correlation-id') ?? crypto.randomUUID()
  const user = await getSessionUser()

  if (!user) {
    return apiError('AUTHENTICATION_REQUIRED', 'Sign in is required.', 401, correlationId)
  }

  const profile = await getActiveProfile()
  if (!profile || profile.role !== 'ADMIN') {
    return apiError('INSUFFICIENT_PERMISSION', 'Admin access is required.', 403, correlationId)
  }

  const url = new URL(request.url)
  const parsed = auditSearchSchema.safeParse({
    from: url.searchParams.get('from') ?? undefined,
    to: url.searchParams.get('to') ?? undefined,
    action: url.searchParams.get('action') ?? undefined,
    actor_id: url.searchParams.get('actor_id') ?? undefined,
    correlation_id: url.searchParams.get('correlation_id') ?? undefined,
    cursor: url.searchParams.get('cursor') ?? undefined,
    limit: url.searchParams.get('limit') ?? undefined,
  })

  if (!parsed.success) {
    return apiError('VALIDATION_FAILED', 'Request validation failed.', 400, correlationId, {
      fieldErrors: Object.fromEntries(
        parsed.error.issues.map((issue) => [issue.path.join('.'), [issue.message]]),
      ),
    })
  }

  const result = await searchAuditLogs(parsed.data)
  if (!result) {
    return apiError(
      'SERVICE_UNAVAILABLE',
      'Audit search is temporarily unavailable.',
      503,
      correlationId,
      { retryable: true },
    )
  }

  return apiSuccess(result, 200, correlationId)
}

export async function HEAD() {
  return new NextResponse(null, { status: 204 })
}
