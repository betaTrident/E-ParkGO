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

describe('dashboard integration', () => {
  let available = false
  let client: ReturnType<typeof createClient>

  beforeAll(async () => {
    available = await isLocalSupabaseAvailable()
    if (!available) {
      return
    }

    client = createClient(localUrl, localAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    await client.auth.signInWithPassword({
      email: staffEmail,
      password: staffPassword,
    })
  })

  it('returns a bounded location snapshot from RPC', async (context) => {
    if (!available) {
      context.skip()
    }

    const { data, error } = await client.rpc('get_dashboard_snapshot')
    const snapshot = data as {
      location_id: string
      metrics: { total_capacity: number }
      zones: unknown[]
      recent_movements: unknown[]
    } | null

    expect(error).toBeNull()
    expect(snapshot?.location_id).toBe('11111111-1111-4111-8111-111111111111')
    expect(snapshot?.metrics?.total_capacity).toBeGreaterThan(0)
    expect(Array.isArray(snapshot?.zones)).toBe(true)
    expect((snapshot?.recent_movements ?? []).length).toBeLessThanOrEqual(20)
  })
})
