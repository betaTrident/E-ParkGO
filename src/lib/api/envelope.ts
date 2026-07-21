import { NextResponse } from 'next/server'

export type ApiErrorCode =
  | 'VALIDATION_FAILED'
  | 'AUTHENTICATION_REQUIRED'
  | 'INSUFFICIENT_PERMISSION'
  | 'RESOURCE_NOT_FOUND'
  | 'ACTIVE_SESSION_EXISTS'
  | 'SPACE_NOT_AVAILABLE'
  | 'TICKET_INVALID'
  | 'TICKET_REVOKED'
  | 'TICKET_ALREADY_COMPLETED'
  | 'WRONG_LOCATION'
  | 'INVALID_STATUS_TRANSITION'
  | 'QUOTE_EXPIRED'
  | 'RATE_NOT_CONFIGURED'
  | 'IDEMPOTENCY_CONFLICT'
  | 'RATE_LIMITED'
  | 'RATE_LIMITED'
  | 'SERVICE_UNAVAILABLE'
  | 'INTERNAL_ERROR'

export interface ApiEnvelope<T> {
  success: boolean
  data: T | null
  error: null | {
    code: ApiErrorCode
    message: string
    field_errors?: Record<string, string[]>
    correlation_id: string
    retryable: boolean
  }
  meta?: {
    server_time: string
    request_id: string
  }
}

export function apiSuccess<T>(
  data: T,
  status = 200,
  requestId?: string,
): NextResponse<ApiEnvelope<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      error: null,
      meta: {
        server_time: new Date().toISOString(),
        request_id: requestId ?? crypto.randomUUID(),
      },
    },
    { status },
  )
}

export function apiError(
  code: ApiErrorCode,
  message: string,
  status: number,
  correlationId: string,
  options?: {
    fieldErrors?: Record<string, string[]>
    retryable?: boolean
  },
): NextResponse<ApiEnvelope<null>> {
  return NextResponse.json(
    {
      success: false,
      data: null,
      error: {
        code,
        message,
        ...(options?.fieldErrors ? { field_errors: options.fieldErrors } : {}),
        correlation_id: correlationId,
        retryable: options?.retryable ?? false,
      },
      meta: {
        server_time: new Date().toISOString(),
        request_id: correlationId,
      },
    },
    { status },
  )
}

const DOMAIN_ERROR_STATUS: Record<string, { code: ApiErrorCode; status: number }> = {
  ACTIVE_SESSION_EXISTS: { code: 'ACTIVE_SESSION_EXISTS', status: 409 },
  SPACE_NOT_AVAILABLE: { code: 'SPACE_NOT_AVAILABLE', status: 409 },
  RATE_NOT_CONFIGURED: { code: 'RATE_NOT_CONFIGURED', status: 422 },
  IDEMPOTENCY_CONFLICT: { code: 'IDEMPOTENCY_CONFLICT', status: 409 },
  TICKET_INVALID: { code: 'TICKET_INVALID', status: 404 },
  TICKET_REVOKED: { code: 'TICKET_REVOKED', status: 409 },
  TICKET_ALREADY_COMPLETED: { code: 'TICKET_ALREADY_COMPLETED', status: 409 },
  INVALID_STATUS_TRANSITION: { code: 'INVALID_STATUS_TRANSITION', status: 409 },
  RATE_LIMITED: { code: 'RATE_LIMITED', status: 429 },
  WRONG_LOCATION: { code: 'TICKET_INVALID', status: 404 },
  authentication_required: { code: 'AUTHENTICATION_REQUIRED', status: 401 },
  staff_authorization_required: { code: 'INSUFFICIENT_PERMISSION', status: 403 },
}

export function mapRpcError(
  error: { message: string } | null,
  correlationId: string,
): NextResponse<ApiEnvelope<null>> {
  if (!error) {
    return apiError(
      'INTERNAL_ERROR',
      'Unable to complete the request.',
      500,
      correlationId,
      { retryable: true },
    )
  }

  const normalized = error.message.toUpperCase()
  for (const [needle, mapping] of Object.entries(DOMAIN_ERROR_STATUS)) {
    if (normalized.includes(needle.toUpperCase())) {
      return apiError(
        mapping.code,
        humanizeDomainError(mapping.code),
        mapping.status,
        correlationId,
      )
    }
  }

  if (error.message.toLowerCase().includes('authentication required')) {
    return apiError(
      'AUTHENTICATION_REQUIRED',
      'Sign in is required.',
      401,
      correlationId,
    )
  }

  return apiError('INTERNAL_ERROR', 'Unable to complete the request.', 500, correlationId, {
    retryable: true,
  })
}

function humanizeDomainError(code: ApiErrorCode): string {
  switch (code) {
    case 'ACTIVE_SESSION_EXISTS':
      return 'This vehicle already has an active parking session.'
    case 'SPACE_NOT_AVAILABLE':
      return 'The selected space is not available.'
    case 'RATE_NOT_CONFIGURED':
      return 'No published rate is configured for this vehicle type.'
    case 'IDEMPOTENCY_CONFLICT':
      return 'This idempotency key was already used with different request data.'
    case 'TICKET_INVALID':
      return 'Ticket not found.'
    case 'TICKET_REVOKED':
      return 'This ticket is no longer valid.'
    case 'TICKET_ALREADY_COMPLETED':
      return 'This ticket has already been completed.'
    case 'RATE_LIMITED':
      return 'Too many attempts. Try again shortly.'
    default:
      return 'Unable to complete the request.'
  }
}
