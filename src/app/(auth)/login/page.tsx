import { AuthShell } from "@/features/auth/components/auth-shell";
import { LoginForm } from "@/features/auth/components/login-form";

interface LoginPageProps {
  searchParams: Promise<{
    next?: string;
    error?: string;
    passwordUpdated?: string;
    reason?: string;
  }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <AuthShell>
      <div className="mb-7 space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Sign in to access your E-ParkGO account.
        </p>
      </div>

      {params.passwordUpdated === "1" ? (
        <p
          className="mb-5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-800 dark:text-emerald-200"
          role="status"
        >
          Your password was updated. You can now sign in.
        </p>
      ) : null}

      {params.error ? (
        <p
          className="mb-5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
          role="alert"
        >
          Authentication could not be completed. Please try again.
        </p>
      ) : null}

      {params.reason === "account-unavailable" ? (
        <p
          className="mb-5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-900 dark:text-amber-100"
          role="alert"
        >
          This account is disabled or is not assigned to a parking facility.
          Contact your administrator.
        </p>
      ) : null}

      <LoginForm nextPath={params.next} />

      <p className="mt-6 border-t pt-5 text-center text-xs text-muted-foreground">
        Need access? Contact your facility administrator.
      </p>
    </AuthShell>
  );
}
