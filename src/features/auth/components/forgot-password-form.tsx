"use client";

import { useActionState } from "react";
import { Mail } from "lucide-react";

import {
  requestPasswordRecoveryAction,
  type RecoveryActionState,
} from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: RecoveryActionState = { message: null, error: null };

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(
    requestPasswordRecoveryAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email">Email address</Label>
        <div className="relative">
          <Mail
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className="h-12 pl-10"
            required
            disabled={isPending}
            aria-describedby="recovery-status"
          />
        </div>
      </div>

      <div id="recovery-status" aria-live="polite">
        {state.error ? (
          <p className="text-sm text-destructive" role="alert">
            {state.error}
          </p>
        ) : null}
        {state.message ? (
          <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-800 dark:text-emerald-200">
            {state.message}
          </p>
        ) : null}
      </div>

      <Button type="submit" className="h-12 w-full" disabled={isPending}>
        {isPending ? "Sending recovery link…" : "Send recovery link"}
      </Button>
    </form>
  );
}
