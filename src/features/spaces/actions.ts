'use server'

import { revalidatePath } from 'next/cache'

import {
  createSpaceSchema,
  createVehicleTypeSchema,
  createZoneSchema,
  spaceStatusUpdateSchema,
  updateSpaceSchema,
} from '@/features/spaces/schemas'
import {
  createSpace,
  createVehicleType,
  createZone,
  updateSpace,
  updateSpaceStatus,
} from '@/features/spaces/service'
import { requireAdminProfile } from '@/lib/auth/session'

export interface SpaceActionState {
  success: boolean
  error: string | null
  message: string | null
}

const initialState = (): SpaceActionState => ({
  success: false,
  error: null,
  message: null,
})

function toFormRecord(formData: FormData): Record<string, unknown> {
  return Object.fromEntries(formData.entries())
}

export async function createZoneAction(
  _prevState: SpaceActionState,
  formData: FormData,
): Promise<SpaceActionState> {
  await requireAdminProfile()
  const parsed = createZoneSchema.safeParse(toFormRecord(formData))

  if (!parsed.success) {
    return {
      ...initialState(),
      error: parsed.error.issues[0]?.message ?? 'Invalid zone request',
    }
  }

  const result = await createZone(parsed.data)

  if (!result.success) {
    return { ...initialState(), error: result.error ?? 'Unable to create zone' }
  }

  revalidatePath('/spaces')
  revalidatePath('/admin/settings')

  return { success: true, error: null, message: 'Zone created.' }
}

export async function createVehicleTypeAction(
  _prevState: SpaceActionState,
  formData: FormData,
): Promise<SpaceActionState> {
  await requireAdminProfile()
  const parsed = createVehicleTypeSchema.safeParse(toFormRecord(formData))

  if (!parsed.success) {
    return {
      ...initialState(),
      error: parsed.error.issues[0]?.message ?? 'Invalid vehicle type request',
    }
  }

  const result = await createVehicleType(parsed.data)

  if (!result.success) {
    return {
      ...initialState(),
      error: result.error ?? 'Unable to create vehicle type',
    }
  }

  revalidatePath('/spaces')
  revalidatePath('/admin/settings')

  return { success: true, error: null, message: 'Vehicle type created.' }
}

export async function createSpaceAction(
  _prevState: SpaceActionState,
  formData: FormData,
): Promise<SpaceActionState> {
  await requireAdminProfile()
  const parsed = createSpaceSchema.safeParse(toFormRecord(formData))

  if (!parsed.success) {
    return {
      ...initialState(),
      error: parsed.error.issues[0]?.message ?? 'Invalid space request',
    }
  }

  const result = await createSpace(parsed.data)

  if (!result.success) {
    return { ...initialState(), error: result.error ?? 'Unable to create space' }
  }

  revalidatePath('/spaces')

  return { success: true, error: null, message: 'Space created.' }
}

export async function updateSpaceAction(
  _prevState: SpaceActionState,
  formData: FormData,
): Promise<SpaceActionState> {
  await requireAdminProfile()
  const parsed = updateSpaceSchema.safeParse(toFormRecord(formData))

  if (!parsed.success) {
    return {
      ...initialState(),
      error: parsed.error.issues[0]?.message ?? 'Invalid space update',
    }
  }

  const result = await updateSpace(parsed.data)

  if (!result.success) {
    return { ...initialState(), error: result.error ?? 'Unable to update space' }
  }

  revalidatePath('/spaces')

  return { success: true, error: null, message: 'Space updated.' }
}

export async function updateSpaceStatusAction(
  _prevState: SpaceActionState,
  formData: FormData,
): Promise<SpaceActionState> {
  await requireAdminProfile()
  const parsed = spaceStatusUpdateSchema.safeParse(toFormRecord(formData))

  if (!parsed.success) {
    return {
      ...initialState(),
      error: parsed.error.issues[0]?.message ?? 'Invalid status update',
    }
  }

  const result = await updateSpaceStatus(parsed.data)

  if (!result.success) {
    return {
      ...initialState(),
      error: result.error ?? 'Unable to update space status',
    }
  }

  revalidatePath('/spaces')

  return { success: true, error: null, message: 'Space status updated.' }
}
