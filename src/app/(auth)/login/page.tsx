import { AuthShell } from "@/features/auth/components/auth-shell";
import { LoginForm } from "@/features/auth/components/login-form";
import { BrandLogo } from "@/components/shared/brand-logo";
import { UsersRound } from "lucide-react";

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
      <div className="mb-8 text-center">
        <BrandLogo compact className="mx-auto mb-6" priority />
        <h1 className="text-[1.75rem] font-bold tracking-[-0.025em] text-slate-950 dark:text-white">
          Welcome back
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Sign in to access your E-ParkGO account
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

      <div className="-mx-5 mt-9 border-t border-slate-200 px-5 pt-6 text-center sm:-mx-11 sm:px-11 dark:border-slate-800">
        <p className="flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <UsersRound className="size-[1.125rem]" aria-hidden="true" />
          Staff &amp; Admin Access
        </p>
        <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
          Need access? Contact your facility administrator.
        </p>
      </div>
    </AuthShell>
  );
}
