import { formatInTimeZone, toZonedTime } from 'date-fns-tz'

export const BUSINESS_TIMEZONE = 'Asia/Manila'

export function formatBusinessDateTime(
  instant: string | Date,
  pattern = 'MMM d, yyyy h:mm a',
): string {
  const date = typeof instant === 'string' ? new Date(instant) : instant
  return formatInTimeZone(date, BUSINESS_TIMEZONE, pattern)
}

export function toBusinessZonedTime(instant: string | Date): Date {
  const date = typeof instant === 'string' ? new Date(instant) : instant
  return toZonedTime(date, BUSINESS_TIMEZONE)
}

export function formatQuoteExpiry(instant: string | Date): string {
  return formatBusinessDateTime(instant, "h:mm a 'on' MMM d, yyyy")
}
