"use server";

import { redirect } from "next/navigation";

import {
  loginSchema,
  passwordRecoverySchema,
  passwordUpdateSchema,
} from "@/features/auth/schemas";
import { getSafeRedirectPath } from "@/lib/auth/safe-redirect";
import {
  clearRecoveryIntent,
  hasRecoveryIntent,
} from "@/lib/auth/recovery-intent";
import { env } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface AuthActionState {
  error: string | null;
}

export interface RecoveryActionState {
  message: string | null;
  error?: string | null;
}

const RECOVERY_RESPONSE =
  "If an account exists for that email, a password recovery link has been sent.";

export async function signInAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid credentials",
    };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: "Invalid email or password" };
  }

  const nextPath = formData.get("next");
  const destination = getSafeRedirectPath(
    typeof nextPath === "string" ? nextPath : null,
    "/dashboard",
  );

  redirect(destination);
}

export async function signOutAction() {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return redirect(
      "/dashboard?error=Unable%20to%20sign%20out.%20Please%20try%20again.",
    );
  }

  return redirect("/login");
}

export async function requestPasswordRecoveryAction(
  _prevState: RecoveryActionState,
  formData: FormData,
): Promise<RecoveryActionState> {
  const parsed = passwordRecoverySchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return {
      message: null,
      error: parsed.error.issues[0]?.message ?? "Enter a valid email address",
    };
  }

  const callbackUrl = new URL("/auth/callback", env.NEXT_PUBLIC_APP_URL);
  callbackUrl.searchParams.set("next", "/update-password");
  callbackUrl.searchParams.set("type", "recovery");

  const supabase = await createServerSupabaseClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: callbackUrl.toString(),
  });

  // Account lookup and delivery failures deliberately share the same response.
  return { message: RECOVERY_RESPONSE, error: null };
}

export async function updatePasswordAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  if (!(await hasRecoveryIntent())) {
    return { error: "Recovery session expired. Request a new recovery link." };
  }

  const parsed = passwordUpdateSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Enter a valid password",
    };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { error: "Unable to update password. Request a new recovery link." };
  }

  const { error: signOutError } = await supabase.auth.signOut({
    scope: "global",
  });

  if (signOutError) {
    return {
      error:
        "Password updated, but other sessions could not be revoked. Contact your administrator.",
    };
  }

  await clearRecoveryIntent();

  redirect("/login?passwordUpdated=1");
}
