import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { AuthShell } from "@/features/auth/components/auth-shell";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <AuthShell>
      <div className="mb-7 space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          Recover your account
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Enter your staff email and we’ll send password recovery instructions.
        </p>
      </div>

      <ForgotPasswordForm />

      <Link
        href="/login"
        className="mt-6 flex min-h-11 items-center justify-center gap-2 text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to sign in
      </Link>
    </AuthShell>
  );
}
