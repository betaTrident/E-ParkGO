import Link from 'next/link'

import { signOutAction } from '@/features/auth/actions'
import { requireActiveProfile } from '@/lib/auth/session'
import { Button } from '@/components/ui/button'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await requireActiveProfile()

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b bg-background">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div>
            <p className="text-sm font-semibold">E-ParkGO</p>
            <p className="text-xs text-muted-foreground">
              {profile.full_name} · {profile.role}
            </p>
          </div>
          <nav className="flex items-center gap-3">
            <Link href="/dashboard" className="text-sm hover:underline">
              Dashboard
            </Link>
            <form action={signOutAction}>
              <Button type="submit" variant="outline" size="sm">
                Sign out
              </Button>
            </form>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  )
}
