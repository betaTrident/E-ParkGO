"use client";

import { useActionState } from "react";
import { LockKeyhole } from "lucide-react";

import {
  updatePasswordAction,
  type AuthActionState,
} from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AuthActionState = { error: null };

export function UpdatePasswordForm() {
  const [state, formAction, isPending] = useActionState(
    updatePasswordAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="password">New password</Label>
        <div className="relative">
          <LockKeyhole
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            className="h-12 pl-10"
            required
            minLength={12}
            maxLength={128}
            disabled={isPending}
            aria-describedby="password-guidance password-error"
          />
        </div>
        <p
          id="password-guidance"
          className="text-xs leading-5 text-muted-foreground"
        >
          Use at least 12 characters with uppercase, lowercase, number, and
          symbol.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm new password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          className="h-12"
          required
          minLength={12}
          maxLength={128}
          disabled={isPending}
          aria-describedby="password-error"
        />
      </div>

      {state.error ? (
        <p
          id="password-error"
          className="text-sm text-destructive"
          role="alert"
        >
          {state.error}
        </p>
      ) : (
        <span id="password-error" />
      )}

      <Button type="submit" className="h-12 w-full" disabled={isPending}>
        {isPending ? "Updating password…" : "Update password"}
      </Button>
    </form>
  );
}
