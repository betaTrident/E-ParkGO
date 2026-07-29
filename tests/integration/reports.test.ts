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

function manilaToday(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

describe('reports integration', () => {
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

  it('returns bounded transaction search results', async (context) => {
    if (!available) {
      context.skip()
    }

    const today = manilaToday()
    const { data, error } = await client.rpc('list_transactions', {
      p_from: today,
      p_to: today,
      p_status: null,
      p_plate: null,
      p_cursor: null,
      p_limit: 25,
    } as never)

    expect(error).toBeNull()
    const payload = data as { items: unknown[]; pagination: { limit: number } } | null
    expect(Array.isArray(payload?.items)).toBe(true)
    expect(payload?.pagination.limit).toBeLessThanOrEqual(100)
  })

  it('returns reconciled report preview summary', async (context) => {
    if (!available) {
      context.skip()
    }

    const today = manilaToday()
    const { data, error } = await client.rpc('get_report_preview', {
      p_report_type: 'DAILY_REVENUE',
      p_from: today,
      p_to: today,
    } as never)

    expect(error).toBeNull()
    const payload = data as { timezone: string; summary: Record<string, string> } | null
    expect(payload?.timezone).toBe('Asia/Manila')
    expect(payload?.summary.net_revenue_centavos).toBeDefined()
  })
})
