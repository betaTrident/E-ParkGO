import { NextResponse } from 'next/server'

import {
  containsForbiddenEntryField,
  entryRequestSchema,
} from '@/features/entry/schemas'
import { createParkingEntry } from '@/features/entry/service'
import {
  apiError,
  apiSuccess,
  mapRpcError,
} from '@/lib/api/envelope'
import { getSessionUser } from '@/lib/auth/session'

const MAX_BODY_BYTES = 4_096

export async function POST(request: Request) {
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

  const contentLength = Number(request.headers.get('content-length') ?? '0')
  if (contentLength > MAX_BODY_BYTES) {
    return apiError(
      'VALIDATION_FAILED',
      'Request body is too large.',
      400,
      correlationId,
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return apiError('VALIDATION_FAILED', 'Invalid JSON body.', 400, correlationId)
  }

  if (!body || typeof body !== 'object') {
    return apiError('VALIDATION_FAILED', 'Invalid request body.', 400, correlationId)
  }

  if (containsForbiddenEntryField(body as Record<string, unknown>)) {
    return apiError('VALIDATION_FAILED', 'Request contains forbidden fields.', 400, correlationId)
  }

  const idempotencyKey = request.headers.get('idempotency-key')
  if (!idempotencyKey) {
    return apiError(
      'VALIDATION_FAILED',
      'Idempotency-Key header is required.',
      400,
      correlationId,
      { fieldErrors: { idempotency_key: ['Required'] } },
    )
  }

  const parsed = entryRequestSchema.safeParse({
    ...(body as Record<string, unknown>),
    idempotency_key: idempotencyKey,
    correlation_id: correlationId,
  })

  if (!parsed.success) {
    return apiError(
      'VALIDATION_FAILED',
      'Request validation failed.',
      400,
      correlationId,
      {
        fieldErrors: Object.fromEntries(
          parsed.error.issues.map((issue) => [issue.path.join('.'), [issue.message]]),
        ),
      },
    )
  }

  const result = await createParkingEntry(parsed.data)

  if (!result.success || !result.data) {
    return mapRpcError({ message: result.error ?? 'INTERNAL_ERROR' }, correlationId)
  }

  return apiSuccess(result.data, 201, correlationId)
}

export function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
