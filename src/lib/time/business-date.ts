import { formatInTimeZone } from 'date-fns-tz'

const MANILA_TZ = 'Asia/Manila'

export function getManilaBusinessDate(date = new Date()): string {
  return formatInTimeZone(date, MANILA_TZ, 'yyyy-MM-dd')
}

export function getDefaultReportRange(): { from: string; to: string } {
  const to = getManilaBusinessDate()
  const fromDate = new Date()
  fromDate.setDate(fromDate.getDate() - 7)
  return {
    from: getManilaBusinessDate(fromDate),
    to,
  }
}
