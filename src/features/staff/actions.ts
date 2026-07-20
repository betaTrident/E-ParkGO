'use server'

import { revalidatePath } from 'next/cache'

import {
  disableStaffSchema,
  inviteStaffSchema,
  reactivateStaffSchema,
  updateStaffPermissionsSchema,
  updateStaffRoleSchema,
} from '@/features/staff/schemas'
import {
  disableStaffMember,
  inviteStaffMember,
  reactivateStaffMember,
  updateStaffPermissions,
  updateStaffRole,
} from '@/features/staff/service'
import { requireAdminProfile } from '@/lib/auth/session'

export interface StaffActionState {
  success: boolean
  error: string | null
  message: string | null
}

const initialStaffActionState = (): StaffActionState => ({
  success: false,
  error: null,
  message: null,
})

function toFormRecord(formData: FormData): Record<string, unknown> {
  return Object.fromEntries(formData.entries())
}

export async function inviteStaffAction(
  _prevState: StaffActionState,
  formData: FormData,
): Promise<StaffActionState> {
  const actor = await requireAdminProfile()
  const parsed = inviteStaffSchema.safeParse({
    email: formData.get('email'),
    fullName: formData.get('fullName'),
    role: formData.get('role'),
    temporaryPassword: formData.get('temporaryPassword'),
    permissions: {
      can_approve_overrides: formData.get('can_approve_overrides') === 'on',
      can_void_payments: formData.get('can_void_payments') === 'on',
      can_process_lost_tickets: formData.get('can_process_lost_tickets') === 'on',
      can_correct_session_times: formData.get('can_correct_session_times') === 'on',
      can_cancel_sessions: formData.get('can_cancel_sessions') === 'on',
    },
  })

  if (!parsed.success) {
    return {
      ...initialStaffActionState(),
      error: parsed.error.issues[0]?.message ?? 'Invalid staff invite request',
    }
  }

  const result = await inviteStaffMember(actor, parsed.data)

  if (!result.success) {
    return {
      ...initialStaffActionState(),
      error: result.error ?? 'Unable to invite staff member',
    }
  }

  revalidatePath('/admin/staff')
  return {
    success: true,
    error: null,
    message: 'Staff member invited successfully.',
  }
}

export async function disableStaffAction(
  _prevState: StaffActionState,
  formData: FormData,
): Promise<StaffActionState> {
  await requireAdminProfile()
  const parsed = disableStaffSchema.safeParse(toFormRecord(formData))

  if (!parsed.success) {
    return {
      ...initialStaffActionState(),
      error: parsed.error.issues[0]?.message ?? 'Invalid disable request',
    }
  }

  const result = await disableStaffMember(parsed.data)

  if (!result.success) {
    return {
      ...initialStaffActionState(),
      error: result.error ?? 'Unable to disable staff member',
    }
  }

  revalidatePath('/admin/staff')
  return {
    success: true,
    error: null,
    message: 'Staff member disabled and sessions revoked.',
  }
}

export async function reactivateStaffAction(
  _prevState: StaffActionState,
  formData: FormData,
): Promise<StaffActionState> {
  await requireAdminProfile()
  const parsed = reactivateStaffSchema.safeParse(toFormRecord(formData))

  if (!parsed.success) {
    return {
      ...initialStaffActionState(),
      error: parsed.error.issues[0]?.message ?? 'Invalid reactivation request',
    }
  }

  const result = await reactivateStaffMember(parsed.data)

  if (!result.success) {
    return {
      ...initialStaffActionState(),
      error: result.error ?? 'Unable to reactivate staff member',
    }
  }

  revalidatePath('/admin/staff')
  return {
    success: true,
    error: null,
    message: 'Staff member reactivated.',
  }
}

export async function updateStaffPermissionsAction(
  _prevState: StaffActionState,
  formData: FormData,
): Promise<StaffActionState> {
  await requireAdminProfile()
  const parsed = updateStaffPermissionsSchema.safeParse({
    targetProfileId: formData.get('targetProfileId'),
    permissions: {
      can_approve_overrides: formData.get('can_approve_overrides') === 'on',
      can_void_payments: formData.get('can_void_payments') === 'on',
      can_process_lost_tickets: formData.get('can_process_lost_tickets') === 'on',
      can_correct_session_times: formData.get('can_correct_session_times') === 'on',
      can_cancel_sessions: formData.get('can_cancel_sessions') === 'on',
    },
  })

  if (!parsed.success) {
    return {
      ...initialStaffActionState(),
      error: parsed.error.issues[0]?.message ?? 'Invalid permission update',
    }
  }

  const result = await updateStaffPermissions(parsed.data)

  if (!result.success) {
    return {
      ...initialStaffActionState(),
      error: result.error ?? 'Unable to update permissions',
    }
  }

  revalidatePath('/admin/staff')
  return {
    success: true,
    error: null,
    message: 'Permissions updated.',
  }
}

export async function updateStaffRoleAction(
  _prevState: StaffActionState,
  formData: FormData,
): Promise<StaffActionState> {
  await requireAdminProfile()
  const parsed = updateStaffRoleSchema.safeParse(toFormRecord(formData))

  if (!parsed.success) {
    return {
      ...initialStaffActionState(),
      error: parsed.error.issues[0]?.message ?? 'Invalid role update',
    }
  }

  const result = await updateStaffRole(parsed.data)

  if (!result.success) {
    return {
      ...initialStaffActionState(),
      error: result.error ?? 'Unable to update role',
    }
  }

  revalidatePath('/admin/staff')
  return {
    success: true,
    error: null,
    message: 'Role updated.',
  }
}
