import { PageHeader } from '@/components/shared/page-header'
import { ScannerPageClient } from '@/features/scanner/components/scanner-page-client'

export default function ScannerPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 sm:p-6 xl:p-7">
      <PageHeader
        title="Scan & exit review"
        description="Scan a QR ticket using your camera, or enter the ticket number manually."
      />
      <ScannerPageClient />
    </div>
  )
}
