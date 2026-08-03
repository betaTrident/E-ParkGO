import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ZoneOccupancy } from '@/components/dashboard/zone-occupancy'
import type { DashboardZoneSnapshot } from '@/features/dashboard/types'

const zones: DashboardZoneSnapshot[] = [
  {
    zone_id: '22222222-2222-4222-8222-222222222221',
    zone_code: 'A',
    zone_name: 'Zone A',
    total_spaces: 4,
    available_spaces: 2,
    occupied_spaces: 1,
    out_of_service_spaces: 1,
  },
]

describe('ZoneOccupancy', () => {
  it('renders an empty-state message when no zones exist', () => {
    render(<ZoneOccupancy zones={[]} />)

    expect(screen.getByLabelText('Zone occupancy')).toHaveTextContent(
      'No active zones configured for this facility.',
    )
  })

  it('renders occupancy bars and legend for configured zones', () => {
    render(<ZoneOccupancy zones={zones} />)

    expect(screen.getByText('Zone A')).toBeInTheDocument()
    expect(screen.getByText('Available')).toBeInTheDocument()
    expect(screen.getByText('Occupied')).toBeInTheDocument()
    expect(screen.getByText('Out of service')).toBeInTheDocument()
    expect(screen.getByLabelText(/Zone A: 2 available, 1 occupied, 1 out of service/)).toBeInTheDocument()
  })
})
