/**
 * @vitest-environment node
 */
import { createClient } from '@supabase/supabase-js'
import { beforeAll, describe, expect, it } from 'vitest'

const defaultLocalUrl = 'http://127.0.0.1:55321'
const localAnonKey =
  process.env.E2E_SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const adminEmail = 'admin@eparkgo.local'
const adminPassword = 'Admin123!@#'

describe('exception workflow integration', () => {
  let available = false
  let accessToken = ''

  beforeAll(async () => {
    try {
      const client = createClient(defaultLocalUrl, localAnonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
      const { error } = await client.auth.signInWithPassword({
        email: adminEmail,
        password: adminPassword,
      })
      available = !error
      if (!error) {
        const { data } = await client.auth.getSession()
        accessToken = data.session?.access_token ?? ''
      }
    } catch {
      available = false
    }
  })

  it('cancels an unpaid session with permission', async (context) => {
    if (!available) {
      context.skip()
    }

    const client = createClient(defaultLocalUrl, localAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    await client.auth.setSession({
      access_token: accessToken,
      refresh_token: 'integration-refresh-token',
    })

    const vehicleTypeId = '33333333-3333-4333-8333-333333333331'
    const locationId = '11111111-1111-4111-8111-111111111111'

    const { data: spaces } = await client
      .from('parking_spaces')
      .select('id')
      .eq('parking_location_id', locationId)
      .eq('vehicle_type_id', vehicleTypeId)
      .eq('status', 'AVAILABLE')
      .eq('is_active', true)
      .limit(20)

    if (!spaces?.length) {
      context.skip()
      return
    }

    const plate = `EX${Date.now().toString().slice(-6)}`
    let entry = null as Awaited<ReturnType<typeof client.rpc>> | null

    for (const space of spaces) {
      const attempt = await client.rpc('create_parking_entry', {
        p_plate: plate,
        p_vehicle_type_id: vehicleTypeId,
        p_color: null,
        p_space_id: space.id,
        p_idempotency_key: crypto.randomUUID(),
        p_correlation_id: crypto.randomUUID(),
      })

      if (!attempt.error) {
        entry = attempt
        break
      }
    }

    if (!entry) {
      context.skip()
      return
    }

    const sessionId = (entry.data as { session_id?: string })?.session_id
    const cancel = await client.rpc('cancel_parking_session', {
      p_session_id: sessionId,
      p_reason: 'Admin approved cancellation for integration test.',
      p_idempotency_key: crypto.randomUUID(),
      p_correlation_id: crypto.randomUUID(),
    })

    expect((cancel.data as { status?: string })?.status).toBe('CANCELLED')
  })
})
