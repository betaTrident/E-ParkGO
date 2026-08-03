'use server'

import { revalidatePath } from 'next/cache'

import { capacitySchema, facilitySettingsSchema } from '@/features/facility/schemas'
import { updateFacilitySettings, updateLocationCapacities } from '@/features/facility/service'
import { requireAdminProfile } from '@/lib/auth/session'

export interface FacilityActionState {
  success: boolean
  error: string | null
  message: string | null
}

const initialState = (): FacilityActionState => ({
  success: false,
  error: null,
  message: null,
})

export async function updateFacilitySettingsAction(
  _prevState: FacilityActionState,
  formData: FormData,
): Promise<FacilityActionState> {
  await requireAdminProfile()

  const parsed = facilitySettingsSchema.safeParse({
    name: formData.get('name'),
    timezone: formData.get('timezone'),
    receiptPrefix: formData.get('receiptPrefix'),
    graceDisplayMinutes: formData.get('graceDisplayMinutes'),
  })

  if (!parsed.success) {
    return {
      ...initialState(),
      error: parsed.error.issues[0]?.message ?? 'Invalid facility settings',
    }
  }

  const result = await updateFacilitySettings(parsed.data)

  if (!result.success) {
    return {
      ...initialState(),
      error: result.error ?? 'Unable to update facility settings',
    }
  }

  revalidatePath('/admin/settings')
  revalidatePath('/spaces')

  return {
    success: true,
    error: null,
    message: 'Facility settings saved.',
  }
}

export async function updateLocationCapacitiesAction(
  _prevState: FacilityActionState,
  formData: FormData,
): Promise<FacilityActionState> {
  await requireAdminProfile()

  const parsed = capacitySchema.safeParse({
    carCapacity: formData.get('carCapacity'),
    motorcycleCapacity: formData.get('motorcycleCapacity'),
  })

  if (!parsed.success) {
    return {
      ...initialState(),
      error: parsed.error.issues[0]?.message ?? 'Invalid capacity values',
    }
  }

  const result = await updateLocationCapacities(parsed.data)

  if (!result.success) {
    return {
      ...initialState(),
      error: result.error ?? 'Unable to update capacities',
    }
  }

  revalidatePath('/admin/settings')
  revalidatePath('/entry')
  revalidatePath('/dashboard')

  return {
    success: true,
    error: null,
    message: 'Capacity pools saved.',
  }
}
