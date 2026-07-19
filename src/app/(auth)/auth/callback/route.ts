import { NextResponse } from "next/server";

import { getSafeRedirectPath } from "@/lib/auth/safe-redirect";
import { RECOVERY_INTENT_COOKIE } from "@/lib/auth/recovery-intent";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const destination = getSafeRedirectPath(
    requestUrl.searchParams.get("next"),
    "/dashboard",
  );
  const isRecovery = requestUrl.searchParams.get("type") === "recovery";

  if (destination === "/update-password" && !isRecovery) {
    return NextResponse.redirect(
      new URL("/login?error=Authentication%20failed", requestUrl.origin),
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=Authentication%20failed", requestUrl.origin),
    );
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL("/login?error=Authentication%20failed", requestUrl.origin),
    );
  }

  const response = NextResponse.redirect(
    new URL(destination, requestUrl.origin),
  );

  if (destination === "/update-password" && isRecovery) {
    response.cookies.set(RECOVERY_INTENT_COOKIE, "1", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 10 * 60,
      path: "/update-password",
    });
  }

  return response;
}
