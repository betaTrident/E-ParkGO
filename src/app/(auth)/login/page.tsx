import Link from 'next/link'

import { LoginForm } from '@/features/auth/components/login-form'

interface LoginPageProps {
  searchParams: Promise<{ next?: string; error?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams

  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-muted/30 px-4 py-12">
      <div className="w-full max-w-md space-y-6 rounded-xl border bg-background p-8 shadow-sm">
        <div className="space-y-2 text-center">
          <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            E-ParkGO
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">Staff sign in</h1>
          <p className="text-sm text-muted-foreground">
            Use your assigned facility account to access protected operations.
          </p>
        </div>

        {params.error ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {params.error}
          </p>
        ) : null}

        <LoginForm nextPath={params.next} />

        <p className="text-center text-xs text-muted-foreground">
          Need access? Contact your facility administrator.
        </p>
        <p className="text-center text-xs">
          <Link href="/" className="text-primary underline-offset-4 hover:underline">
            Back to home
          </Link>
        </p>
      </div>
    </div>
  )
}
