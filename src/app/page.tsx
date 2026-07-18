import Link from 'next/link'

import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function Home() {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-muted/20 px-4 py-16">
      <div className="w-full max-w-xl space-y-6 text-center">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            E-ParkGO
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Parking operations platform
          </h1>
          <p className="text-muted-foreground">
            Staff authentication, location-scoped authorization, and database-backed
            operational integrity are ready for the next workflow phases.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/login" className={cn(buttonVariants())}>
            Staff sign in
          </Link>
          <Link href="/dashboard" className={cn(buttonVariants({ variant: 'outline' }))}>
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
