import { z } from 'zod'

const forbiddenValidationFields = [
  'actor_id',
  'actorId',
  'location_id',
  'locationId',
  'parking_location_id',
  'session_id',
  'sessionId',
  'status',
  'entry_time',
  'entryTime',
  'total_centavos',
  'totalCentavos',
] as const

export function containsForbiddenValidationField(
  input: Record<string, unknown>,
): boolean {
  return forbiddenValidationFields.some((field) => field in input)
}

const ticketNumberSchema = z
  .string()
  .trim()
  .min(12, 'Ticket number is too short')
  .max(32, 'Ticket number is too long')
  .transform((value) => value.toUpperCase())

const tokenSchema = z
  .string()
  .trim()
  .regex(/^[A-Za-z0-9_-]{43}$/, 'Invalid QR token shape')

export const ticketValidationRequestSchema = z
  .object({
    token: tokenSchema.optional(),
    ticket_number: ticketNumberSchema.optional(),
    idempotency_key: z.uuid('Idempotency key is required'),
    correlation_id: z.uuid('Correlation id is required').optional(),
  })
  .strict()
  .superRefine((value, context) => {
    const hasToken = Boolean(value.token)
    const hasTicket = Boolean(value.ticket_number)

    if (hasToken === hasTicket) {
      context.addIssue({
        code: 'custom',
        message: 'Provide either a QR token or a ticket number.',
        path: ['token'],
      })
    }
  })

export type TicketValidationRequestInput = z.infer<
  typeof ticketValidationRequestSchema
>

export const manualTicketFormSchema = z
  .object({
    ticketNumber: ticketNumberSchema,
  })
  .strict()

export type ManualTicketFormInput = z.infer<typeof manualTicketFormSchema>
