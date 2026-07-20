'use server'

import { revalidatePath } from 'next/cache'

import { facilitySettingsSchema } from '@/features/facility/schemas'
import { updateFacilitySettings } from '@/features/facility/service'
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
