import { redirect } from 'next/navigation'

import { hasStaffPermission } from '@/lib/auth/permissions'
import { requireActiveProfile } from '@/lib/auth/session'
import type { StaffPermissionKey } from '@/lib/auth/types'

export async function requirePermission(permission: StaffPermissionKey) {
  const profile = await requireActiveProfile()

  if (!hasStaffPermission(profile.permissions, permission)) {
    redirect('/dashboard')
  }

  return profile
}
