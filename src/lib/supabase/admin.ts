import { createClient } from '@supabase/supabase-js'

import { getServerEnv } from '@/lib/env'

/**
 * Service-role client for trusted server workflows only.
 * Never import from client components or expose to the browser.
 */
export function createAdminSupabaseClient() {
  const serverEnv = getServerEnv()

  return createClient(
    serverEnv.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  )
}
