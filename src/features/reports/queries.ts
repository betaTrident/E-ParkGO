export interface PaginationMeta {
  limit: number
  next_cursor: string | null
}

export interface TransactionRow {
  payment_id: string
  receipt_number: string
  payment_kind: string
  amount_centavos: string
  processed_at: string
  session_id: string
  session_status: string
  plate_display: string
}

export interface TransactionListResult {
  items: TransactionRow[]
  pagination: PaginationMeta
}

export interface ReportPreviewResult {
  report_type: string
  from: string
  to: string
  timezone: string
  location_id: string
  summary: Record<string, string | number>
}

export interface ReportExportResult {
  export_id: string
  audit_log_id: number | null
  report_type: string
  from: string
  to: string
  timezone: string
  rows: Record<string, string>[]
  row_count: number
}

export interface AuditEventRow {
  id: number
  created_at: string
  action: string
  target_type: string
  target_id: string | null
  result: string
  reason: string | null
  correlation_id: string
  actor_id: string | null
  before_data: Record<string, unknown> | null
  after_data: Record<string, unknown> | null
}

export interface AuditSearchResult {
  items: AuditEventRow[]
  pagination: PaginationMeta
}

export interface ShiftHistoryRow {
  shift_id: string
  profile_id: string
  status: string
  opened_at: string
  closed_at: string | null
  opening_float_centavos: string
  expected_cash_centavos: string
  declared_cash_centavos: string
  variance_centavos: string
  notes: string | null
}

export interface ShiftHistoryResult {
  items: ShiftHistoryRow[]
  pagination: PaginationMeta
}
