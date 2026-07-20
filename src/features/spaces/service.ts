import { randomUUID } from 'node:crypto'

import type {
  CreateSpaceInput,
  CreateVehicleTypeInput,
  CreateZoneInput,
  SpaceFilterInput,
  SpaceStatusUpdateInput,
  UpdateSpaceInput,
} from '@/features/spaces/schemas'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export type SpaceStatus = 'AVAILABLE' | 'OCCUPIED' | 'OUT_OF_SERVICE'

export interface SpaceBoardRecord {
  id: string
  code: string
  status: SpaceStatus
  version: number
  is_active: boolean
  zone_id: string
  zone_code: string
  zone_name: string
  vehicle_type_id: string | null
  vehicle_type_code: string | null
}

export interface ZoneRecord {
  id: string
  code: string
  name: string
  sort_order: number
  is_active: boolean
}

export interface VehicleTypeRecord {
  id: string
  code: string
  name: string
  is_active: boolean
}

export interface ConfigurationActionResult {
  success: boolean
  error?: string
  version?: number
}

function mapSpaceRpcError(error: { message: string } | null): string {
  if (!error) {
    return 'Unable to complete the space action.'
  }

  const message = error.message.toLowerCase()

  if (message.includes('admin authorization required')) {
    return 'Administrator access is required.'
  }

  if (message.includes('space version conflict')) {
    return 'This space was updated elsewhere. Refresh and try again.'
  }

  if (message.includes('zone not found') || message.includes('vehicle type not found')) {
    return 'Selected zone or vehicle type is not available for this facility.'
  }

  if (message.includes('duplicate key')) {
    return 'That space or zone code is already in use.'
  }

  if (message.includes('occupied spaces cannot be deactivated')) {
    return 'Occupied spaces cannot be deactivated.'
  }

  return 'Unable to complete the space action.'
}

export async function listZones(locationId: string): Promise<ZoneRecord[]> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('parking_zones')
    .select('id, code, name, sort_order, is_active')
    .eq('parking_location_id', locationId)
    .order('sort_order')

  if (error || !data) {
    return []
  }

  return data
}

export async function listVehicleTypes(locationId: string): Promise<VehicleTypeRecord[]> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('vehicle_types')
    .select('id, code, name, is_active')
    .eq('parking_location_id', locationId)
    .order('code')

  if (error || !data) {
    return []
  }

  return data
}

export async function listSpaces(
  locationId: string,
  filters: SpaceFilterInput = {},
): Promise<SpaceBoardRecord[]> {
  const supabase = await createServerSupabaseClient()
  let query = supabase
    .from('parking_spaces')
    .select(
      `
      id,
      code,
      status,
      version,
      is_active,
      zone_id,
      vehicle_type_id,
      parking_zones!inner (code, name),
      vehicle_types (code)
    `,
    )
    .eq('parking_location_id', locationId)
    .eq('is_active', true)
    .order('code')

  if (filters.zoneId) {
    query = query.eq('zone_id', filters.zoneId)
  }

  if (filters.status) {
    query = query.eq('status', filters.status)
  }

  const { data, error } = await query

  if (error || !data) {
    return []
  }

  return data.map((row) => {
    const zone = Array.isArray(row.parking_zones)
      ? row.parking_zones[0]
      : row.parking_zones
    const vehicleType = Array.isArray(row.vehicle_types)
      ? row.vehicle_types[0]
      : row.vehicle_types

    return {
      id: row.id,
      code: row.code,
      status: row.status as SpaceStatus,
      version: Number(row.version),
      is_active: row.is_active,
      zone_id: row.zone_id,
      zone_code: zone?.code ?? '',
      zone_name: zone?.name ?? '',
      vehicle_type_id: row.vehicle_type_id,
      vehicle_type_code: vehicleType?.code ?? null,
    }
  })
}

export async function createZone(input: CreateZoneInput): Promise<ConfigurationActionResult> {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.rpc('admin_create_parking_zone', {
    p_code: input.code,
    p_name: input.name,
    p_sort_order: input.sortOrder,
    p_correlation_id: randomUUID(),
  })

  if (error) {
    return { success: false, error: mapSpaceRpcError(error) }
  }

  return { success: true }
}

export async function createVehicleType(
  input: CreateVehicleTypeInput,
): Promise<ConfigurationActionResult> {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.rpc('admin_create_vehicle_type', {
    p_code: input.code,
    p_name: input.name,
    p_correlation_id: randomUUID(),
  })

  if (error) {
    return { success: false, error: mapSpaceRpcError(error) }
  }

  return { success: true }
}

export async function createSpace(input: CreateSpaceInput): Promise<ConfigurationActionResult> {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.rpc('admin_create_parking_space', {
    p_zone_id: input.zoneId,
    p_code: input.code,
    p_vehicle_type_id: input.vehicleTypeId,
    p_correlation_id: randomUUID(),
  })

  if (error) {
    return { success: false, error: mapSpaceRpcError(error) }
  }

  return { success: true }
}

export async function updateSpace(input: UpdateSpaceInput): Promise<ConfigurationActionResult> {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.rpc('admin_update_parking_space', {
    p_space_id: input.spaceId,
    p_zone_id: input.zoneId,
    p_vehicle_type_id: input.vehicleTypeId,
    p_correlation_id: randomUUID(),
  })

  if (error) {
    return { success: false, error: mapSpaceRpcError(error) }
  }

  return { success: true }
}

export async function updateSpaceStatus(
  input: SpaceStatusUpdateInput,
): Promise<ConfigurationActionResult> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.rpc('admin_set_parking_space_status', {
    p_space_id: input.spaceId,
    p_status: input.status,
    p_expected_version: Number(input.expectedVersion),
    p_correlation_id: randomUUID(),
  })

  if (error) {
    return { success: false, error: mapSpaceRpcError(error) }
  }

  return { success: true, version: Number(data) }
}
