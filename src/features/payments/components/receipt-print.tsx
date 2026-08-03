'use client'

import { formatCentavosForDisplay } from '@/lib/money/centavos'

interface ReceiptPrintProps {
  receiptNumber: string
  ticketNumber: string
  plateNumber: string
  amountCentavos: string
  cashTenderedCentavos: string
  changeCentavos: string
}

export function ReceiptPrint({
  receiptNumber,
  ticketNumber,
  plateNumber,
  amountCentavos,
  cashTenderedCentavos,
  changeCentavos,
}: ReceiptPrintProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 print:border-black dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold">Receipt {receiptNumber}</h2>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-lg border px-3 py-2 text-sm font-medium print:hidden"
        >
          Print receipt
        </button>
      </div>
      <dl className="mt-4 grid gap-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">Ticket</dt>
          <dd className="font-medium">{ticketNumber}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">Plate</dt>
          <dd className="font-medium">{plateNumber}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">Paid</dt>
          <dd className="font-medium">{formatCentavosForDisplay(amountCentavos)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">Tendered</dt>
          <dd className="font-medium">{formatCentavosForDisplay(cashTenderedCentavos)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">Change</dt>
          <dd className="font-medium">{formatCentavosForDisplay(changeCentavos)}</dd>
        </div>
      </dl>
    </section>
  )
}
