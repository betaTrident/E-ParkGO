import { ScannerPageClient } from '@/features/scanner/components/scanner-page-client'

export default function ScannerPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8 sm:px-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-blue-600 dark:text-blue-300">Operations</p>
        <h1 className="text-3xl font-bold tracking-tight">Scan &amp; exit review</h1>
        <p className="max-w-2xl text-slate-600 dark:text-slate-400">
          Scan a QR ticket after granting camera access, or enter the ticket number manually when
          the camera is unavailable.
        </p>
      </header>
      <ScannerPageClient />
    </div>
  )
}
