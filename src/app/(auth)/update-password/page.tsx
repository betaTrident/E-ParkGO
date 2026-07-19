import { redirect } from "next/navigation";

import { AuthShell } from "@/features/auth/components/auth-shell";
import { UpdatePasswordForm } from "@/features/auth/components/update-password-form";
import { getSessionUser } from "@/lib/auth/session";
import { hasRecoveryIntent } from "@/lib/auth/recovery-intent";

export default async function UpdatePasswordPage() {
  const [user, recoveryIntent] = await Promise.all([
    getSessionUser(),
    hasRecoveryIntent(),
  ]);

  if (!user || !recoveryIntent) {
    redirect("/login?error=Authentication%20failed");
  }

  return (
    <AuthShell>
      <div className="mb-7 space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          Set a new password
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Choose a strong password for your E-ParkGO staff account.
        </p>
      </div>
      <UpdatePasswordForm />
    </AuthShell>
  );
}
