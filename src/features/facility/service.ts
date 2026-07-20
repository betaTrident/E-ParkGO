import { randomUUID } from 'node:crypto'

import type { FacilitySettingsInput } from '@/features/facility/schemas'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export interface FacilitySettingsRecord {
  id: string
  name: string
  timezone: string
  currency: string
  receipt_prefix: string
  settings: Record<string, unknown>
}

export interface ConfigurationActionResult {
  success: boolean
  error?: string
}

function mapConfigurationRpcError(error: { message: string } | null): string {
  if (!error) {
    return 'Unable to complete the configuration action.'
  }

  const message = error.message.toLowerCase()

  if (message.includes('admin authorization required')) {
    return 'Administrator access is required.'
  }

  if (message.includes('facility name is required')) {
    return 'Facility name is required.'
  }

  if (message.includes('duplicate key') || message.includes('already exists')) {
    return 'That code is already in use for this facility.'
  }

  return 'Unable to complete the configuration action.'
}

export async function getFacilitySettings(
  locationId: string,
): Promise<FacilitySettingsRecord | null> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('parking_locations')
    .select('id, name, timezone, currency, receipt_prefix, settings')
    .eq('id', locationId)
    .maybeSingle()

  if (error || !data) {
    return null
  }

  return {
    ...data,
    settings:
      data.settings && typeof data.settings === 'object' && !Array.isArray(data.settings)
        ? (data.settings as Record<string, unknown>)
        : {},
  }
}

export async function updateFacilitySettings(
  input: FacilitySettingsInput,
): Promise<ConfigurationActionResult> {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.rpc('admin_update_facility_settings', {
    p_name: input.name,
    p_timezone: input.timezone,
    p_receipt_prefix: input.receiptPrefix,
    p_settings: {
      grace_display_minutes: input.graceDisplayMinutes,
    },
    p_correlation_id: randomUUID(),
  })

  if (error) {
    return { success: false, error: mapConfigurationRpcError(error) }
  }

  return { success: true }
}
