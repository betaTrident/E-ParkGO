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
const localServiceKey =
  process.env.E2E_SUPABASE_SERVICE_ROLE_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const adminEmail = 'admin@eparkgo.local'
const adminPassword = 'Admin123!@#'
const integrationEmail = `integration.staff.${Date.now()}@example.invalid`

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

describe('auth admin integration', () => {
  let available = false
  let createdProfileId: string | null = null

  beforeAll(async () => {
    available = await isLocalSupabaseAvailable()
  })

  afterAll(async () => {
    if (!available || !createdProfileId) {
      return
    }

    const admin = createClient(localUrl, localServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    await admin.auth.admin.deleteUser(createdProfileId)
  })

  it('creates, disables, and reactivates staff through protected RPCs', async (context) => {
    if (!available) {
      context.skip()
    }

    const adminClient = createClient(localUrl, localServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const sessionClient = createClient(localUrl, localAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { error: signInError } = await sessionClient.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword,
    })
    expect(signInError).toBeNull()

    const { data: createdUser, error: createUserError } =
      await adminClient.auth.admin.createUser({
        email: integrationEmail,
        password: 'TempPass123!@#',
        email_confirm: true,
      })

    expect(createUserError).toBeNull()
    createdProfileId = createdUser.user?.id ?? null
    expect(createdProfileId).toBeTruthy()

    const correlationId = crypto.randomUUID()
    const { error: profileError } = await sessionClient.rpc(
      'admin_create_staff_profile',
      {
        p_user_id: createdProfileId,
        p_full_name: 'Integration Staff',
        p_role: 'STAFF',
        p_can_approve_overrides: false,
        p_can_void_payments: false,
        p_can_process_lost_tickets: false,
        p_can_correct_session_times: false,
        p_can_cancel_sessions: false,
        p_correlation_id: correlationId,
      },
    )

    expect(profileError).toBeNull()

    const { error: disableError } = await sessionClient.rpc('admin_disable_staff', {
      p_target_id: createdProfileId,
      p_reason: 'Integration disable flow',
      p_correlation_id: crypto.randomUUID(),
    })

    expect(disableError).toBeNull()

    const { data: disabledProfile } = await sessionClient
      .from('profiles')
      .select('is_active')
      .eq('id', createdProfileId!)
      .single()

    expect(disabledProfile?.is_active).toBe(false)

    const staffClient = createClient(localUrl, localAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { data: staffSession, error: staffSignInError } =
      await staffClient.auth.signInWithPassword({
        email: integrationEmail,
        password: 'TempPass123!@#',
      })

    expect(staffSignInError).toBeNull()
    expect(staffSession.session).not.toBeNull()

    const { data: inactiveProfile } = await staffClient
      .from('profiles')
      .select('id')
      .eq('id', createdProfileId!)
      .maybeSingle()

    expect(inactiveProfile).toBeNull()

    const { error: reactivateError } = await sessionClient.rpc(
      'admin_reactivate_staff',
      {
        p_target_id: createdProfileId,
        p_reason: 'Integration reactivation flow',
        p_correlation_id: crypto.randomUUID(),
      },
    )

    expect(reactivateError).toBeNull()

    const { data: activeProfile } = await sessionClient
      .from('profiles')
      .select('is_active')
      .eq('id', createdProfileId!)
      .single()

    expect(activeProfile?.is_active).toBe(true)
  })
})
