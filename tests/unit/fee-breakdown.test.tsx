import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { FeeBreakdown } from '@/features/exit/components/fee-breakdown'

const preview = {
  session_id: '11111111-1111-4111-8111-111111111111',
  status: 'PAYMENT_PENDING' as const,
  billed_minutes: 16,
  subtotal_centavos: '5000',
  discount_centavos: '0',
  penalty_centavos: '0',
  adjustment_centavos: '0',
  total_centavos: '5000',
  fee_version: 1,
  quote_expires_at: '2026-07-21T12:15:00.000Z',
}

describe('FeeBreakdown', () => {
  it('renders itemized totals and quote expiry accessibly', () => {
    render(
      <FeeBreakdown
        preview={preview}
        entryTime="2026-07-21T10:00:00.000Z"
      />,
    )

    expect(screen.getByRole('heading', { name: 'Fee preview' })).toBeInTheDocument()
    expect(screen.getByText('Total due')).toBeInTheDocument()
    expect(screen.getByText('Payment pending')).toBeInTheDocument()
    expect(screen.getByText(/Quote expires:/)).toBeInTheDocument()
  })

  it('announces expired quotes without hiding the breakdown', () => {
    render(
      <FeeBreakdown
        preview={preview}
        entryTime="2026-07-21T10:00:00.000Z"
        quoteExpired
      />,
    )

    expect(screen.getByRole('status')).toHaveTextContent(/quote has expired/i)
  })
})
