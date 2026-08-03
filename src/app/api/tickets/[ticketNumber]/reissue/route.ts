import { NextResponse } from 'next/server'

import { reissueSchema } from '@/features/tickets/service'
import {
  getSessionIdForTicket,
  reissueParkingTicket,
} from '@/features/tickets/service'
import {
  apiError,
  apiSuccess,
  mapRpcError,
} from '@/lib/api/envelope'
import { getActiveProfile } from '@/lib/auth/profile'

const MAX_BODY_BYTES = 2_048

interface RouteContext {
  params: Promise<{ ticketNumber: string }>
}

export async function POST(request: Request, context: RouteContext) {
  const correlationId = request.headers.get('x-correlation-id') ?? crypto.randomUUID()
  const { ticketNumber } = await context.params

  const profile = await getActiveProfile()
  if (!profile) {
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

  const idempotencyKey = request.headers.get('idempotency-key')
  if (!idempotencyKey) {
    return apiError(
      'VALIDATION_FAILED',
      'Idempotency-Key header is required.',
      400,
      correlationId,
    )
  }

  const parsed = reissueSchema.safeParse({
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

  const sessionId = await getSessionIdForTicket(ticketNumber, profile.parking_location_id)
  if (!sessionId) {
    return apiError('TICKET_INVALID', 'Ticket not found.', 404, correlationId)
  }

  const result = await reissueParkingTicket(
    sessionId,
    profile.parking_location_id,
    parsed.data,
  )

  if (!result.success || !result.data) {
    return mapRpcError({ message: result.error ?? 'INTERNAL_ERROR' }, correlationId)
  }

  return apiSuccess(result.data, 200, correlationId)
}

export function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
