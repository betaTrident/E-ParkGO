import { createClient } from '@supabase/supabase-js'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function loadEnvFile(filename) {
  const path = resolve(process.cwd(), filename)
  if (!existsSync(path)) return {}
  const content = readFileSync(path, 'utf8')
  const entries = {}

  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const index = trimmed.indexOf('=')
    if (index === -1) continue
    const key = trimmed.slice(0, index).trim()
    const value = trimmed.slice(index + 1).trim()
    entries[key] = value
  }

  return entries
}

async function main() {
  let failed = false
  const env = {
    ...loadEnvFile('.env'),
    ...loadEnvFile('.env.local'),
    ...process.env,
  }
  const url = env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !anonKey || !serviceKey) {
    console.error('FAIL: missing required Supabase env vars')
    process.exit(1)
  }

  const anon = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const authHealth = await fetch(`${url}/auth/v1/health`, {
    headers: { apikey: anonKey },
  })
  console.log(`auth_health: ${authHealth.status} ${authHealth.ok ? 'OK' : 'FAIL'}`)
  failed ||= !authHealth.ok

  const { error: anonProfilesError } = await anon.from('profiles').select('id').limit(1)
  if (!anonProfilesError) {
    console.log('anon_profiles_access: FAIL anonymous role can reach profiles')
    failed = true
  } else if (anonProfilesError.code === '42501') {
    console.log('anon_profiles_access: OK permission denied as expected')
  } else {
    console.log(`anon_profiles_access: FAIL unexpected code=${anonProfilesError.code ?? 'unknown'}`)
    failed = true
  }

  const { data: locations, error: adminLocationsError } = await admin
    .from('parking_locations')
    .select('id, code, name')
    .limit(5)

  if (adminLocationsError) {
    console.log(
      `service_parking_locations_query: FAIL code=${adminLocationsError.code ?? 'unknown'} message=${adminLocationsError.message}`,
    )
    failed = true
  } else {
    console.log(`service_parking_locations_query: OK rows=${locations?.length ?? 0}`)
  }

  const { count, error: adminCountError } = await admin
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  if (adminCountError) {
    console.log(
      `service_profiles_count: FAIL code=${adminCountError.code ?? 'unknown'} message=${adminCountError.message}`,
    )
    failed = true
  } else {
    console.log(`service_profiles_count: OK count=${count ?? 0}`)
  }

  if (failed) process.exit(1)
}

main().catch((error) => {
  console.error('FAIL: unexpected error', error)
  process.exit(1)
})
