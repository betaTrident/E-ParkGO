import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { TicketView } from '@/components/tickets/ticket-view'
import { buildVerifyUrl, generateQrToken } from '@/lib/security/qr-token'

vi.mock('react-qr-code', () => ({
  default: ({ value }: { value: string }) => <div data-testid="qr-code">{value}</div>,
}))

const baseFacts = {
  ticket_number: 'EPG-260721-ABCD1234X',
  entry_time: '2026-07-21T00:00:00.000Z',
  display_plate_number: 'ABC-1234',
  vehicle_type_code: 'CAR',
  space_code: 'A-01',
  zone_code: 'A',
  status: 'ACTIVE',
  qr_payload: null,
}

describe('TicketView', () => {
  it('renders ticket facts and qr code when credential is present', () => {
    const token = generateQrToken()
    const qrPayload = buildVerifyUrl('https://app.example.test', token)

    render(
      <TicketView
        facts={baseFacts}
        qrPayload={qrPayload}
        onClearCredential={() => undefined}
      />,
    )

    expect(screen.getByRole('heading', { name: baseFacts.ticket_number })).toBeInTheDocument()
    expect(screen.getByTestId('qr-code')).toHaveTextContent(qrPayload)
    expect(
      screen.getByLabelText(`QR code for ticket ${baseFacts.ticket_number}`),
    ).toBeInTheDocument()
  })

  it('announces reissue requirement when credential is unavailable', () => {
    render(
      <TicketView
        facts={baseFacts}
        qrPayload={null}
        credentialRecovery="REISSUE_REQUIRED"
        onClearCredential={() => undefined}
      />,
    )

    expect(
      screen.getByText(/one-time qr credential is no longer available/i),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Print ticket' })).toBeDisabled()
  })

  it('invokes print when the print action is selected', async () => {
    const user = userEvent.setup()
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => undefined)
    const token = generateQrToken()
    const qrPayload = buildVerifyUrl('https://app.example.test', token)

    render(
      <TicketView
        facts={baseFacts}
        qrPayload={qrPayload}
        onClearCredential={() => undefined}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Print ticket' }))
    expect(printSpy).toHaveBeenCalled()
  })
})
