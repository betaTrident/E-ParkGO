import type {
  AuditSearchInput,
  ReportExportInput,
  ReportPreviewInput,
  TransactionQueryInput,
} from '@/features/reports/schemas'
import type {
  AuditSearchResult,
  ReportExportResult,
  ReportPreviewResult,
  ShiftHistoryResult,
  TransactionListResult,
} from '@/features/reports/queries'
import { createServerSupabaseClient } from '@/lib/supabase/server'

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function parseListResult<T>(value: unknown): { items: T[]; pagination: { limit: number; next_cursor: string | null } } | null {
  if (!isRecord(value) || !Array.isArray(value.items) || !isRecord(value.pagination)) {
    return null
  }

  return {
    items: value.items as T[],
    pagination: {
      limit: Number(value.pagination.limit ?? 25),
      next_cursor: typeof value.pagination.next_cursor === 'string' ? value.pagination.next_cursor : null,
    },
  }
}

export async function listTransactions(
  input: TransactionQueryInput,
): Promise<TransactionListResult | null> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.rpc('list_transactions', {
    p_from: input.from,
    p_to: input.to,
    p_status: input.status ?? null,
    p_plate: input.plate ?? null,
    p_cursor: input.cursor ?? null,
    p_limit: input.limit ?? 25,
  })

  if (error || !data) {
    console.error('list_transactions RPC failed', { code: error?.code })
    return null
  }

  return parseListResult(data) as TransactionListResult | null
}

export async function getReportPreview(
  input: ReportPreviewInput,
): Promise<ReportPreviewResult | null> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.rpc('get_report_preview', {
    p_report_type: input.type,
    p_from: input.from,
    p_to: input.to,
  })

  if (error || !data || !isRecord(data)) {
    console.error('get_report_preview RPC failed', { code: error?.code })
    return null
  }

  return data as unknown as ReportPreviewResult
}

export async function exportReport(
  input: ReportExportInput,
): Promise<{ data: ReportExportResult | null; errorCode?: string }> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.rpc('export_report', {
    p_report_type: input.type,
    p_from: input.from,
    p_to: input.to,
    p_idempotency_key: input.idempotency_key,
    p_correlation_id: input.correlation_id ?? crypto.randomUUID(),
  })

  if (error) {
    return { data: null, errorCode: error.message }
  }

  if (!data || !isRecord(data)) {
    return { data: null }
  }

  return { data: data as unknown as ReportExportResult }
}

export async function searchAuditLogs(
  input: AuditSearchInput,
): Promise<AuditSearchResult | null> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.rpc('search_audit_logs', {
    p_from: input.from,
    p_to: input.to,
    p_action: input.action ?? null,
    p_actor_id: input.actor_id ?? null,
    p_correlation_id: input.correlation_id ?? null,
    p_cursor: input.cursor ?? null,
    p_limit: input.limit ?? 25,
  })

  if (error || !data) {
    console.error('search_audit_logs RPC failed', { code: error?.code })
    return null
  }

  return parseListResult(data) as AuditSearchResult | null
}

export async function listShiftHistory(
  cursor?: string,
  limit = 25,
): Promise<ShiftHistoryResult | null> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.rpc('list_shift_history', {
    p_cursor: cursor ?? null,
    p_limit: limit,
  })

  if (error || !data) {
    console.error('list_shift_history RPC failed', { code: error?.code })
    return null
  }

  return parseListResult(data) as ShiftHistoryResult | null
}
