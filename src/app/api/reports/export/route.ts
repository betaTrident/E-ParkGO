import { NextResponse } from 'next/server'

import { exportReport } from '@/features/reports/service'
import { reportExportSchema } from '@/features/reports/schemas'
import { apiError, mapRpcError } from '@/lib/api/envelope'
import { getSessionUser } from '@/lib/auth/session'
import { getActiveProfile } from '@/lib/auth/profile'
import { serializeCsv } from '@/lib/security/csv'

const MAX_BODY_BYTES = 2_048

export async function POST(request: Request) {
  const correlationId = request.headers.get('x-correlation-id') ?? crypto.randomUUID()
  const user = await getSessionUser()

  if (!user) {
    return apiError('AUTHENTICATION_REQUIRED', 'Sign in is required.', 401, correlationId)
  }

  const profile = await getActiveProfile()
  if (!profile || profile.role !== 'ADMIN') {
    return apiError('INSUFFICIENT_PERMISSION', 'Admin access is required to export reports.', 403, correlationId)
  }

  const contentLength = Number(request.headers.get('content-length') ?? '0')
  if (contentLength > MAX_BODY_BYTES) {
    return apiError('VALIDATION_FAILED', 'Request body is too large.', 400, correlationId)
  }

  const idempotencyKey = request.headers.get('idempotency-key')
  if (!idempotencyKey) {
    return apiError('VALIDATION_FAILED', 'Idempotency-Key header is required.', 400, correlationId, {
      fieldErrors: { idempotency_key: ['Required'] },
    })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return apiError('VALIDATION_FAILED', 'Invalid JSON body.', 400, correlationId)
  }

  const parsed = reportExportSchema.safeParse({
    ...(body as Record<string, unknown>),
    idempotency_key: idempotencyKey,
    correlation_id: correlationId,
  })

  if (!parsed.success) {
    return apiError('VALIDATION_FAILED', 'Request validation failed.', 400, correlationId, {
      fieldErrors: Object.fromEntries(
        parsed.error.issues.map((issue) => [issue.path.join('.'), [issue.message]]),
      ),
    })
  }

  const { data, errorCode } = await exportReport(parsed.data)
  if (!data) {
    if (errorCode) {
      return mapRpcError({ message: errorCode }, correlationId)
    }
    return apiError('INTERNAL_ERROR', 'Unable to export report.', 500, correlationId, {
      retryable: true,
    })
  }

  const headers = Object.keys(data.rows[0] ?? { report: 'value' })
  const csvRows = [
    headers,
    ...data.rows.map((row) => headers.map((header) => String(row[header] ?? ''))),
  ]

  const csv = serializeCsv(csvRows)
  const filename = `eparkgo-${data.report_type.toLowerCase()}-${data.from}-${data.to}.csv`

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'X-Export-Id': data.export_id,
      'X-Correlation-Id': correlationId,
      'X-Request-Id': correlationId,
    },
  })
}

export async function HEAD() {
  return new NextResponse(null, { status: 204 })
}
