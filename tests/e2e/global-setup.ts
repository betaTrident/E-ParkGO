const localSupabaseUrl = process.env.E2E_SUPABASE_URL ?? 'http://127.0.0.1:55321'
const localSupabaseAnonKey =
  process.env.E2E_SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

async function waitForSupabase(): Promise<void> {
  const attempts = 30

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(`${localSupabaseUrl}/auth/v1/health`, {
        headers: { apikey: localSupabaseAnonKey },
      })

      if (response.ok) {
        return
      }
    } catch {
      // Retry until local Supabase is ready.
    }

    await new Promise((resolve) => setTimeout(resolve, 2_000))
  }

  throw new Error(
    `Local Supabase is not reachable at ${localSupabaseUrl}. Start it with "npm run db:start".`,
  )
}

export default async function globalSetup(): Promise<void> {
  await waitForSupabase()
}
