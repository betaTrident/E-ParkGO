import { NextResponse } from 'next/server'
import { z } from 'zod'

import { listTransactions } from '@/features/reports/service'
import { baseTransactionQuerySchema } from '@/features/reports/schemas'
import { apiError, apiSuccess } from '@/lib/api/envelope'
import { getSessionUser } from '@/lib/auth/session'

const querySchema = baseTransactionQuerySchema.extend({
  from: z.string().optional(),
  to: z.string().optional(),
})

export async function GET(request: Request) {
  const correlationId = request.headers.get('x-correlation-id') ?? crypto.randomUUID()
  const user = await getSessionUser()

  if (!user) {
    return apiError('AUTHENTICATION_REQUIRED', 'Sign in is required.', 401, correlationId)
  }

  const url = new URL(request.url)
  const parsed = querySchema.safeParse({
    from: url.searchParams.get('from') ?? undefined,
    to: url.searchParams.get('to') ?? undefined,
    status: url.searchParams.get('status') ?? undefined,
    plate: url.searchParams.get('plate') ?? undefined,
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

  if (!parsed.data.from || !parsed.data.to) {
    return apiError('VALIDATION_FAILED', 'from and to are required.', 400, correlationId, {
      fieldErrors: {
        from: parsed.data.from ? [] : ['Required'],
        to: parsed.data.to ? [] : ['Required'],
      },
    })
  }

  const result = await listTransactions({
    from: parsed.data.from,
    to: parsed.data.to,
    ...(parsed.data.status ? { status: parsed.data.status } : {}),
    ...(parsed.data.plate ? { plate: parsed.data.plate } : {}),
    ...(parsed.data.cursor ? { cursor: parsed.data.cursor } : {}),
    ...(parsed.data.limit ? { limit: parsed.data.limit } : {}),
  })

  if (!result) {
    return apiError(
      'SERVICE_UNAVAILABLE',
      'Transactions are temporarily unavailable.',
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
