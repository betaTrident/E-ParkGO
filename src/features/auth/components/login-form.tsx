"use client";

import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInAction, type AuthActionState } from "@/features/auth/actions";

const initialState: AuthActionState = { error: null };

interface LoginFormProps {
  nextPath?: string | undefined;
}

export function LoginForm({ nextPath }: LoginFormProps) {
  const [state, formAction, isPending] = useActionState(
    signInAction,
    initialState,
  );
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="space-y-5">
      {nextPath ? <input type="hidden" name="next" value={nextPath} /> : null}

      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium">
          Email address
        </Label>
        <div className="relative">
          <Mail
            className="pointer-events-none absolute left-4 top-1/2 size-[1.125rem] -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="you@example.com"
            className="h-14 rounded-lg border-slate-200 bg-white pl-12 text-base shadow-none placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950"
            required
            disabled={isPending}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-medium">
          Password
        </Label>
        <div className="relative">
          <LockKeyhole
            className="pointer-events-none absolute left-4 top-1/2 size-[1.125rem] -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Enter your password"
            className="h-14 rounded-lg border-slate-200 bg-white px-12 text-base shadow-none placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950"
            required
            disabled={isPending}
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="absolute right-2 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            disabled={isPending}
          >
            {showPassword ? (
              <EyeOff className="size-[1.125rem]" aria-hidden="true" />
            ) : (
              <Eye className="size-[1.125rem]" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <span className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <ShieldCheck className="size-4 text-emerald-500" aria-hidden="true" />
          Secure sign-in
        </span>
        <Link
          href="/forgot-password"
          className="flex min-h-11 items-center text-sm font-medium text-blue-600 underline-offset-4 hover:underline dark:text-blue-400"
        >
          Forgot password?
        </Link>
      </div>

      {state.error ? (
        <p
          className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}

      <Button
        type="submit"
        className="h-14 w-full rounded-lg bg-blue-600 text-base font-semibold shadow-[0_8px_20px_rgba(37,99,235,0.20)] hover:bg-blue-700"
        disabled={isPending}
      >
        {isPending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
