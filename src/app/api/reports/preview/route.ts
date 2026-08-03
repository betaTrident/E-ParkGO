import { NextResponse } from 'next/server'

import { getReportPreview } from '@/features/reports/service'
import { reportPreviewSchema } from '@/features/reports/schemas'
import { apiError, apiSuccess } from '@/lib/api/envelope'
import { getSessionUser } from '@/lib/auth/session'

const MAX_BODY_BYTES = 2_048

export async function POST(request: Request) {
  const correlationId = request.headers.get('x-correlation-id') ?? crypto.randomUUID()
  const user = await getSessionUser()

  if (!user) {
    return apiError('AUTHENTICATION_REQUIRED', 'Sign in is required.', 401, correlationId)
  }

  const contentLength = Number(request.headers.get('content-length') ?? '0')
  if (contentLength > MAX_BODY_BYTES) {
    return apiError('VALIDATION_FAILED', 'Request body is too large.', 400, correlationId)
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return apiError('VALIDATION_FAILED', 'Invalid JSON body.', 400, correlationId)
  }

  const parsed = reportPreviewSchema.safeParse(body)
  if (!parsed.success) {
    return apiError('VALIDATION_FAILED', 'Request validation failed.', 400, correlationId, {
      fieldErrors: Object.fromEntries(
        parsed.error.issues.map((issue) => [issue.path.join('.'), [issue.message]]),
      ),
    })
  }

  const preview = await getReportPreview(parsed.data)
  if (!preview) {
    return apiError(
      'SERVICE_UNAVAILABLE',
      'Report preview is temporarily unavailable.',
      503,
      correlationId,
      { retryable: true },
    )
  }

  return apiSuccess(preview, 200, correlationId)
}

export async function HEAD() {
  return new NextResponse(null, { status: 204 })
}
