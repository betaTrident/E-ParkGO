import {
  containsForbiddenPaymentField,
  paymentRequestSchema,
} from '@/features/payments/schemas'
import { recordParkingPayment } from '@/features/payments/service'
import { apiError, apiSuccess, mapRpcError } from '@/lib/api/envelope'
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

  if (!body || typeof body !== 'object') {
    return apiError('VALIDATION_FAILED', 'Invalid request body.', 400, correlationId)
  }

  if (containsForbiddenPaymentField(body as Record<string, unknown>)) {
    return apiError('VALIDATION_FAILED', 'Request contains forbidden fields.', 400, correlationId)
  }

  const idempotencyKey = request.headers.get('idempotency-key')
  if (!idempotencyKey) {
    return apiError('VALIDATION_FAILED', 'Idempotency-Key header is required.', 400, correlationId, {
      fieldErrors: { idempotency_key: ['Required'] },
    })
  }

  const parsed = paymentRequestSchema.safeParse({
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

  const result = await recordParkingPayment(parsed.data)
  if (!result.success) {
    if ('code' in result && result.code) {
      return mapRpcError({ message: result.code }, correlationId)
    }
    return apiError(
      'INTERNAL_ERROR',
      'error' in result ? result.error : 'Unable to record payment.',
      500,
      correlationId,
    )
  }

  if (!result.data) {
    return apiError('INTERNAL_ERROR', 'Unable to record payment.', 500, correlationId)
  }

  return apiSuccess(result.data, 200, correlationId)
}
