import {
  containsForbiddenExceptionField,
  lostTicketRequestSchema,
} from '@/features/sessions/schemas'
import { processLostTicket } from '@/features/sessions/service'
import { apiError, apiSuccess, mapRpcError } from '@/lib/api/envelope'
import { getSessionUser } from '@/lib/auth/session'

interface RouteContext {
  params: Promise<{ sessionId: string }>
}

export async function POST(request: Request, context: RouteContext) {
  const correlationId = request.headers.get('x-correlation-id') ?? crypto.randomUUID()
  const user = await getSessionUser()
  const { sessionId } = await context.params

  if (!user) {
    return apiError('AUTHENTICATION_REQUIRED', 'Sign in is required.', 401, correlationId)
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return apiError('VALIDATION_FAILED', 'Invalid JSON body.', 400, correlationId)
  }

  if (!body || typeof body !== 'object' || containsForbiddenExceptionField(body as Record<string, unknown>)) {
    return apiError('VALIDATION_FAILED', 'Invalid request body.', 400, correlationId)
  }

  const idempotencyKey = request.headers.get('idempotency-key')
  if (!idempotencyKey) {
    return apiError('VALIDATION_FAILED', 'Idempotency-Key header is required.', 400, correlationId)
  }

  const parsed = lostTicketRequestSchema.safeParse({
    ...(body as Record<string, unknown>),
    idempotency_key: idempotencyKey,
    correlation_id: correlationId,
  })

  if (!parsed.success) {
    return apiError('VALIDATION_FAILED', 'Request validation failed.', 400, correlationId)
  }

  const result = await processLostTicket(sessionId, parsed.data)
  if (!result.success) {
    if ('code' in result && result.code) {
      return mapRpcError({ message: result.code }, correlationId)
    }
    return apiError(
      'INTERNAL_ERROR',
      'error' in result ? result.error : 'Unable to process lost ticket.',
      500,
      correlationId,
    )
  }

  return apiSuccess(result.data, 200, correlationId)
}
