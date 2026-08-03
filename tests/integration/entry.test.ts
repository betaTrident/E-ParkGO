/**
 * @vitest-environment node
 */
import { createClient } from '@supabase/supabase-js'
import { beforeAll, describe, expect, it } from 'vitest'

const defaultLocalUrl = 'http://127.0.0.1:55321'
const localUrl = process.env.E2E_SUPABASE_URL ?? defaultLocalUrl
const localAnonKey =
  process.env.E2E_SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const staffEmail = 'staff@eparkgo.local'
const staffPassword = 'Staff123!@#'

async function isLocalSupabaseAvailable(): Promise<boolean> {
  try {
    const client = createClient(localUrl, localAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { error } = await client.auth.signInWithPassword({
      email: staffEmail,
      password: staffPassword,
    })
    return !error
  } catch {
    return false
  }
}

describe('entry integration', () => {
  let available = false
  let accessToken = ''

  beforeAll(async () => {
    available = await isLocalSupabaseAvailable()
    if (!available) {
      return
    }

    const client = createClient(localUrl, localAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { data } = await client.auth.signInWithPassword({
      email: staffEmail,
      password: staffPassword,
    })
    accessToken = data.session?.access_token ?? ''
  })

  it('creates an entry through the RPC boundary with idempotent replay', async (context) => {
    if (!available) {
      context.skip()
    }

    const client = createClient(localUrl, localAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    await client.auth.setSession({
      access_token: accessToken,
      refresh_token: 'integration-refresh-token',
    })

    const vehicleTypeId = '33333333-3333-4333-8333-333333333331'
    const idempotencyKey = crypto.randomUUID()
    const correlationId = crypto.randomUUID()
    const plate = `INT${Date.now().toString().slice(-6)}`

    const first = await client.rpc('create_parking_entry', {
      p_plate: plate,
      p_vehicle_type_id: vehicleTypeId,
      p_color: null,
      p_idempotency_key: idempotencyKey,
      p_correlation_id: correlationId,
    })

    expect(first.error).toBeNull()
    expect(first.data?.qr_payload).toBeTruthy()

    const replay = await client.rpc('create_parking_entry', {
      p_plate: plate,
      p_vehicle_type_id: vehicleTypeId,
      p_color: null,
      p_idempotency_key: idempotencyKey,
      p_correlation_id: crypto.randomUUID(),
    })

    expect(replay.error).toBeNull()
    expect(replay.data?.qr_payload ?? null).toBeNull()
    expect(replay.data?.credential_recovery).toBe('REISSUE_REQUIRED')
    expect(replay.data?.session_id).toBe(first.data?.session_id)
  })
})
