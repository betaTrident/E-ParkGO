import Link from 'next/link'

import { requireActiveProfile } from '@/lib/auth/session'
import { buttonVariants } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'

export default async function DashboardPage() {
  const profile = await requireActiveProfile()

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Operations dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Facility scope: {profile.parking_location_id}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Session active</CardTitle>
            <CardDescription>Authentication and profile checks passed.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>Name: {profile.full_name}</p>
            <p>Role: {profile.role}</p>
            <p>Location: {profile.parking_location_id}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Next workflows</CardTitle>
            <CardDescription>Phase 5+ routes will appear here.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Link
              href="/entry"
              className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }))}
            >
              Entry
            </Link>
            <Link
              href="/spaces"
              className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }))}
            >
              Spaces
            </Link>
            <Link
              href="/reports"
              className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }))}
            >
              Reports
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
