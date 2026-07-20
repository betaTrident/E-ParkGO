/**
 * @vitest-environment node
 */
import { createClient } from '@supabase/supabase-js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const defaultLocalUrl = 'http://127.0.0.1:55321'
const localUrl = process.env.E2E_SUPABASE_URL ?? defaultLocalUrl
const localAnonKey =
  process.env.E2E_SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const adminEmail = 'admin@eparkgo.local'
const adminPassword = 'Admin123!@#'
const staffEmail = 'staff@eparkgo.local'
const staffPassword = 'Staff123!@#'

async function isLocalSupabaseAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${localUrl}/auth/v1/health`, {
      headers: { apikey: localAnonKey },
    })

    if (!response.ok) {
      return false
    }

    const client = createClient(localUrl, localAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { error } = await client.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword,
    })

    return !error
  } catch {
    return false
  }
}

describe('configuration integration', () => {
  let available = false
  let createdZoneId: string | null = null

  beforeAll(async () => {
    available = await isLocalSupabaseAvailable()
  })

  afterAll(async () => {
    if (!available || !createdZoneId) {
      return
    }

    const client = createClient(localUrl, localAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    await client.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword,
    })
    await client.rpc('admin_deactivate_parking_zone', {
      p_zone_id: createdZoneId,
      p_correlation_id: crypto.randomUUID(),
    })
  })

  it('allows admins to update facility settings and create zones', async (context) => {
    if (!available) {
      context.skip()
    }

    const client = createClient(localUrl, localAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { error: signInError } = await client.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword,
    })
    expect(signInError).toBeNull()

    const correlationId = crypto.randomUUID()
    const { error: settingsError } = await client.rpc(
      'admin_update_facility_settings',
      {
        p_name: 'E-ParkGO Pilot Facility',
        p_timezone: 'Asia/Manila',
        p_receipt_prefix: 'EPG',
        p_settings: { grace_display_minutes: 15 },
        p_correlation_id: correlationId,
      },
    )
    expect(settingsError).toBeNull()

    const zoneCode = `T${Date.now().toString().slice(-4)}`
    const { data: zoneId, error: zoneError } = await client.rpc(
      'admin_create_parking_zone',
      {
        p_code: zoneCode,
        p_name: `Test Zone ${zoneCode}`,
        p_sort_order: 99,
        p_correlation_id: crypto.randomUUID(),
      },
    )

    expect(zoneError).toBeNull()
    expect(zoneId).toBeTruthy()
    createdZoneId = zoneId
  })

  it('denies staff configuration mutations', async (context) => {
    if (!available) {
      context.skip()
    }

    const client = createClient(localUrl, localAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { error: signInError } = await client.auth.signInWithPassword({
      email: staffEmail,
      password: staffPassword,
    })
    expect(signInError).toBeNull()

    const { error } = await client.rpc('admin_create_parking_zone', {
      p_code: 'STAFF',
      p_name: 'Staff Zone',
      p_sort_order: 1,
      p_correlation_id: crypto.randomUUID(),
    })

    expect(error?.message.toLowerCase()).toContain('admin authorization required')
  })

  it('rejects invalid centavos in rate draft RPC boundary', async (context) => {
    if (!available) {
      context.skip()
    }

    const client = createClient(localUrl, localAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    await client.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword,
    })

    const { error } = await client.rpc('admin_create_rate_draft', {
      p_vehicle_type_id: '33333333-3333-4333-8333-333333333332',
      p_mode: 'FLAT',
      p_grace_minutes: 15,
      p_initial_minutes: null,
      p_initial_fee_centavos: null,
      p_succeeding_interval_minutes: null,
      p_succeeding_fee_centavos: null,
      p_flat_fee_centavos: -1,
      p_daily_max_centavos: null,
      p_overnight_fee_centavos: 0,
      p_lost_ticket_penalty_centavos: 10000,
      p_effective_from: '2026-12-01T00:00:00+08:00',
      p_effective_to: null,
      p_correlation_id: crypto.randomUUID(),
    })

    expect(error?.message.toLowerCase()).toContain('nonnegative')
  })
})
