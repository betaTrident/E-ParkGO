import { randomUUID } from 'node:crypto'

import {
  type PublishRateInput,
  type RateDraftInput,
  type RateDraftUpdateInput,
  type RetireRateInput,
  rateDraftToRpcPayload,
  rateRecordCentavosToStrings,
} from '@/features/rates/schemas'
import { centavosToString } from '@/lib/money/centavos'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export interface RateVersionRecord {
  id: string
  vehicle_type_id: string | null
  vehicle_type_code: string | null
  version: number
  mode: 'FLAT' | 'TIERED'
  grace_minutes: number
  initial_minutes: number | null
  initial_fee_centavos: string | null
  succeeding_interval_minutes: number | null
  succeeding_fee_centavos: string | null
  flat_fee_centavos: string | null
  daily_max_centavos: string | null
  overnight_fee_centavos: string
  lost_ticket_penalty_centavos: string
  effective_from: string
  effective_to: string | null
  is_published: boolean
}

export interface ConfigurationActionResult {
  success: boolean
  error?: string
  rateId?: string
}

function mapRateRpcError(error: { message: string } | null): string {
  if (!error) {
    return 'Unable to complete the rate action.'
  }

  const message = error.message.toLowerCase()

  if (message.includes('admin authorization required')) {
    return 'Administrator access is required.'
  }

  if (message.includes('overlap') || message.includes('exclusion')) {
    return 'This rate overlaps an existing published version for the same vehicle type.'
  }

  if (message.includes('tiered rate requires')) {
    return 'Tiered rates require initial and succeeding fee fields.'
  }

  if (message.includes('fee amounts must be nonnegative')) {
    return 'Fee amounts must be zero or greater.'
  }

  if (message.includes('only unpublished')) {
    return 'Only unpublished drafts can be changed.'
  }

  return 'Unable to complete the rate action.'
}

export async function listRateVersions(locationId: string): Promise<RateVersionRecord[]> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('parking_rates')
    .select(
      `
      id,
      vehicle_type_id,
      version,
      mode,
      grace_minutes,
      initial_minutes,
      initial_fee_centavos,
      succeeding_interval_minutes,
      succeeding_fee_centavos,
      flat_fee_centavos,
      daily_max_centavos,
      overnight_fee_centavos,
      lost_ticket_penalty_centavos,
      effective_from,
      effective_to,
      is_published,
      vehicle_types (code)
    `,
    )
    .eq('parking_location_id', locationId)
    .order('effective_from', { ascending: false })
    .order('version', { ascending: false })

  if (error || !data) {
    return []
  }

  return data.map((row) => {
    const vehicleType = Array.isArray(row.vehicle_types)
      ? row.vehicle_types[0]
      : row.vehicle_types
    const mapped = rateRecordCentavosToStrings(row)

    return {
      id: row.id,
      vehicle_type_id: row.vehicle_type_id,
      vehicle_type_code: vehicleType?.code ?? null,
      version: row.version,
      mode: row.mode,
      grace_minutes: row.grace_minutes,
      initial_minutes: row.initial_minutes,
      initial_fee_centavos: (mapped.initial_fee_centavos as string | null) ?? null,
      succeeding_interval_minutes: row.succeeding_interval_minutes,
      succeeding_fee_centavos: (mapped.succeeding_fee_centavos as string | null) ?? null,
      flat_fee_centavos: (mapped.flat_fee_centavos as string | null) ?? null,
      daily_max_centavos: (mapped.daily_max_centavos as string | null) ?? null,
      overnight_fee_centavos: String(mapped.overnight_fee_centavos ?? '0'),
      lost_ticket_penalty_centavos: String(mapped.lost_ticket_penalty_centavos ?? '0'),
      effective_from: row.effective_from,
      effective_to: row.effective_to,
      is_published: row.is_published,
    }
  })
}

export async function createRateDraft(
  input: RateDraftInput,
): Promise<ConfigurationActionResult> {
  const supabase = await createServerSupabaseClient()
  const payload = rateDraftToRpcPayload(input)
  const { data, error } = await supabase.rpc('admin_create_rate_draft', {
    ...payload,
    p_correlation_id: randomUUID(),
  })

  if (error) {
    return { success: false, error: mapRateRpcError(error) }
  }

  return { success: true, rateId: data ?? undefined }
}

export async function updateRateDraft(
  input: RateDraftUpdateInput,
): Promise<ConfigurationActionResult> {
  const supabase = await createServerSupabaseClient()
  const payload = rateDraftToRpcPayload(input)
  const { data, error } = await supabase.rpc('admin_update_rate_draft', {
    p_rate_id: input.rateId,
    ...payload,
    p_correlation_id: randomUUID(),
  })

  if (error) {
    return { success: false, error: mapRateRpcError(error) }
  }

  return { success: true, rateId: data ?? input.rateId }
}

export async function publishRate(input: PublishRateInput): Promise<ConfigurationActionResult> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.rpc('admin_publish_rate', {
    p_rate_id: input.rateId,
    p_correlation_id: randomUUID(),
  })

  if (error) {
    return { success: false, error: mapRateRpcError(error) }
  }

  return { success: true, rateId: data ?? input.rateId }
}

export async function retirePublishedRate(
  input: RetireRateInput,
): Promise<ConfigurationActionResult> {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.rpc('admin_retire_published_rate', {
    p_rate_id: input.rateId,
    p_effective_to: input.effectiveTo,
    p_correlation_id: randomUUID(),
  })

  if (error) {
    return { success: false, error: mapRateRpcError(error) }
  }

  return { success: true, rateId: input.rateId }
}

export async function withdrawRateDraft(
  rateId: string,
): Promise<ConfigurationActionResult> {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.rpc('admin_withdraw_rate_draft', {
    p_rate_id: rateId,
    p_correlation_id: randomUUID(),
  })

  if (error) {
    return { success: false, error: mapRateRpcError(error) }
  }

  return { success: true, rateId }
}

export function formatRateSummary(rate: RateVersionRecord): string {
  if (rate.mode === 'FLAT') {
    return `Flat ${centavosToString(BigInt(rate.flat_fee_centavos ?? '0'))} centavos`
  }

  return `Tiered ${rate.initial_minutes}m @ ${rate.initial_fee_centavos}; then ${rate.succeeding_interval_minutes}m @ ${rate.succeeding_fee_centavos}`
}
