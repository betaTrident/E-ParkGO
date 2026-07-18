import { redirect } from 'next/navigation'

import { getActiveProfile } from '@/lib/auth/profile'
import type { ActiveProfile, AppRole } from '@/lib/auth/types'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function getSessionUser() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}

export async function requireActiveProfile(): Promise<ActiveProfile> {
  const profile = await getActiveProfile()

  if (!profile) {
    redirect('/login')
  }

  return profile
}

export async function requireAdminProfile(): Promise<ActiveProfile> {
  const profile = await requireActiveProfile()

  if (profile.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  return profile
}

export function hasRole(profile: ActiveProfile, role: AppRole): boolean {
  return profile.role === role
}
