import {
  containsForbiddenShiftField,
  closeShiftRequestSchema,
} from '@/features/shifts/schemas'
import { closeStaffShift } from '@/features/shifts/service'
import { apiError, apiSuccess, mapRpcError } from '@/lib/api/envelope'
import { getSessionUser } from '@/lib/auth/session'

export async function POST(request: Request) {
  const correlationId = request.headers.get('x-correlation-id') ?? crypto.randomUUID()
  const user = await getSessionUser()

  if (!user) {
    return apiError('AUTHENTICATION_REQUIRED', 'Sign in is required.', 401, correlationId)
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return apiError('VALIDATION_FAILED', 'Invalid JSON body.', 400, correlationId)
  }

  if (!body || typeof body !== 'object' || containsForbiddenShiftField(body as Record<string, unknown>)) {
    return apiError('VALIDATION_FAILED', 'Invalid request body.', 400, correlationId)
  }

  const idempotencyKey = request.headers.get('idempotency-key')
  if (!idempotencyKey) {
    return apiError('VALIDATION_FAILED', 'Idempotency-Key header is required.', 400, correlationId)
  }

  const parsed = closeShiftRequestSchema.safeParse({
    ...(body as Record<string, unknown>),
    idempotency_key: idempotencyKey,
    correlation_id: correlationId,
  })

  if (!parsed.success) {
    return apiError('VALIDATION_FAILED', 'Request validation failed.', 400, correlationId)
  }

  const result = await closeStaffShift(parsed.data)
  if (!result.success || !result.data) {
    if (result.code) {
      return mapRpcError({ message: result.code }, correlationId)
    }
    return apiError('INTERNAL_ERROR', result.error ?? 'Unable to close shift.', 500, correlationId)
  }

  return apiSuccess(result.data, 200, correlationId)
}
