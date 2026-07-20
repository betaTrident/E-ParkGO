'use server'

import { revalidatePath } from 'next/cache'

import {
  publishRateSchema,
  rateDraftSchema,
  rateDraftUpdateSchema,
  retireRateSchema,
} from '@/features/rates/schemas'
import {
  createRateDraft,
  publishRate,
  retirePublishedRate,
  updateRateDraft,
  withdrawRateDraft,
} from '@/features/rates/service'
import { requireAdminProfile } from '@/lib/auth/session'

export interface RateActionState {
  success: boolean
  error: string | null
  message: string | null
}

const initialState = (): RateActionState => ({
  success: false,
  error: null,
  message: null,
})

function toFormRecord(formData: FormData): Record<string, unknown> {
  return Object.fromEntries(formData.entries())
}

function emptyToUndefined(value: FormDataEntryValue | null): string | undefined {
  if (value === null) {
    return undefined
  }

  const text = String(value).trim()
  return text === '' ? undefined : text
}

function parseRateDraftForm(formData: FormData) {
  return {
    vehicleTypeId: formData.get('vehicleTypeId'),
    mode: formData.get('mode'),
    graceMinutes: formData.get('graceMinutes'),
    initialMinutes: emptyToUndefined(formData.get('initialMinutes')),
    initialFeeCentavos: emptyToUndefined(formData.get('initialFeeCentavos')),
    succeedingIntervalMinutes: emptyToUndefined(
      formData.get('succeedingIntervalMinutes'),
    ),
    succeedingFeeCentavos: emptyToUndefined(formData.get('succeedingFeeCentavos')),
    flatFeeCentavos: emptyToUndefined(formData.get('flatFeeCentavos')),
    dailyMaxCentavos: emptyToUndefined(formData.get('dailyMaxCentavos')),
    overnightFeeCentavos: formData.get('overnightFeeCentavos'),
    lostTicketPenaltyCentavos: formData.get('lostTicketPenaltyCentavos'),
    effectiveFrom: formData.get('effectiveFrom'),
    effectiveTo: emptyToUndefined(formData.get('effectiveTo')),
  }
}

export async function createRateDraftAction(
  _prevState: RateActionState,
  formData: FormData,
): Promise<RateActionState> {
  await requireAdminProfile()
  const parsed = rateDraftSchema.safeParse(parseRateDraftForm(formData))

  if (!parsed.success) {
    return {
      ...initialState(),
      error: parsed.error.issues[0]?.message ?? 'Invalid rate draft',
    }
  }

  const result = await createRateDraft(parsed.data)

  if (!result.success) {
    return { ...initialState(), error: result.error ?? 'Unable to save rate draft' }
  }

  revalidatePath('/admin/rates')

  return { success: true, error: null, message: 'Rate draft saved.' }
}

export async function updateRateDraftAction(
  _prevState: RateActionState,
  formData: FormData,
): Promise<RateActionState> {
  await requireAdminProfile()
  const parsed = rateDraftUpdateSchema.safeParse({
    rateId: formData.get('rateId'),
    ...parseRateDraftForm(formData),
  })

  if (!parsed.success) {
    return {
      ...initialState(),
      error: parsed.error.issues[0]?.message ?? 'Invalid rate draft update',
    }
  }

  const result = await updateRateDraft(parsed.data)

  if (!result.success) {
    return { ...initialState(), error: result.error ?? 'Unable to update rate draft' }
  }

  revalidatePath('/admin/rates')

  return { success: true, error: null, message: 'Rate draft updated.' }
}

export async function publishRateAction(
  _prevState: RateActionState,
  formData: FormData,
): Promise<RateActionState> {
  await requireAdminProfile()
  const parsed = publishRateSchema.safeParse(toFormRecord(formData))

  if (!parsed.success) {
    return {
      ...initialState(),
      error: parsed.error.issues[0]?.message ?? 'Invalid publish request',
    }
  }

  const result = await publishRate(parsed.data)

  if (!result.success) {
    return { ...initialState(), error: result.error ?? 'Unable to publish rate' }
  }

  revalidatePath('/admin/rates')

  return { success: true, error: null, message: 'Rate published and locked.' }
}

export async function retireRateAction(
  _prevState: RateActionState,
  formData: FormData,
): Promise<RateActionState> {
  await requireAdminProfile()
  const parsed = retireRateSchema.safeParse(toFormRecord(formData))

  if (!parsed.success) {
    return {
      ...initialState(),
      error: parsed.error.issues[0]?.message ?? 'Invalid retire request',
    }
  }

  const result = await retirePublishedRate(parsed.data)

  if (!result.success) {
    return { ...initialState(), error: result.error ?? 'Unable to retire rate' }
  }

  revalidatePath('/admin/rates')

  return { success: true, error: null, message: 'Published rate retired.' }
}

export async function withdrawRateDraftAction(
  _prevState: RateActionState,
  formData: FormData,
): Promise<RateActionState> {
  await requireAdminProfile()
  const rateId = formData.get('rateId')

  if (typeof rateId !== 'string' || rateId.trim() === '') {
    return { ...initialState(), error: 'Select a valid rate draft' }
  }

  const result = await withdrawRateDraft(rateId)

  if (!result.success) {
    return { ...initialState(), error: result.error ?? 'Unable to withdraw draft' }
  }

  revalidatePath('/admin/rates')

  return { success: true, error: null, message: 'Draft withdrawn.' }
}
