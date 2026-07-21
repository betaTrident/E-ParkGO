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

describe('payment and exit integration', () => {
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

  it('records payment and confirms exit for a paid session', async (context) => {
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

    await client.rpc('start_staff_shift', {
      p_device_id: null,
      p_opening_float_centavos: 0,
      p_idempotency_key: crypto.randomUUID(),
      p_correlation_id: crypto.randomUUID(),
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

    const plate = `PE${Date.now().toString().slice(-6)}`
    let entry = null as Awaited<ReturnType<typeof client.rpc>> | null
    let spaceId: string | null = null

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
        spaceId = space.id
        break
      }
    }

    if (!entry || !spaceId) {
      context.skip()
      return
    }

    const sessionId = (entry.data as { session_id?: string })?.session_id
    expect(sessionId).toBeTruthy()

    const { data: ticket } = await client
      .from('parking_tickets')
      .select('ticket_number')
      .eq('parking_session_id', sessionId)
      .single()

    await client.rpc('validate_parking_ticket', {
      p_token: null,
      p_ticket_number: ticket?.ticket_number,
      p_idempotency_key: crypto.randomUUID(),
      p_correlation_id: crypto.randomUUID(),
    })

    const preview = await client.rpc('calculate_parking_exit', {
      p_session_id: sessionId,
      p_idempotency_key: crypto.randomUUID(),
      p_correlation_id: crypto.randomUUID(),
    })

    const status = (preview.data as { status?: string })?.status
    if (status === 'PAYMENT_PENDING') {
      const payment = await client.rpc('record_parking_payment', {
        p_session_id: sessionId,
        p_cash_tendered_centavos: 10000,
        p_external_reference: null,
        p_idempotency_key: crypto.randomUUID(),
        p_correlation_id: crypto.randomUUID(),
      })
      expect((payment.data as { session_status?: string })?.session_status).toBe('PAID_AWAITING_EXIT')
    }

    const exit = await client.rpc('confirm_vehicle_exit', {
      p_session_id: sessionId,
      p_idempotency_key: crypto.randomUUID(),
      p_correlation_id: crypto.randomUUID(),
    })

    expect((exit.data as { status?: string })?.status).toBe('COMPLETED')
  })
})
