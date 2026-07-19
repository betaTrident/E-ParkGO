import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  redirectMock,
  signInWithPasswordMock,
  signOutMock,
  resetPasswordForEmailMock,
  updateUserMock,
  hasRecoveryIntentMock,
  clearRecoveryIntentMock,
} = vi.hoisted(() => ({
  redirectMock: vi.fn(),
  signInWithPasswordMock: vi.fn(),
  signOutMock: vi.fn(),
  resetPasswordForEmailMock: vi.fn(),
  updateUserMock: vi.fn(),
  hasRecoveryIntentMock: vi.fn(),
  clearRecoveryIntentMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: vi.fn(async () => ({
    auth: {
      signInWithPassword: signInWithPasswordMock,
      signOut: signOutMock,
      resetPasswordForEmail: resetPasswordForEmailMock,
      updateUser: updateUserMock,
    },
  })),
}));
vi.mock("@/lib/auth/recovery-intent", () => ({
  hasRecoveryIntent: hasRecoveryIntentMock,
  clearRecoveryIntent: clearRecoveryIntentMock,
}));

import {
  requestPasswordRecoveryAction,
  signInAction,
  signOutAction,
  updatePasswordAction,
} from "@/features/auth/actions";

describe("auth actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    signOutMock.mockResolvedValue({ error: null });
    hasRecoveryIntentMock.mockResolvedValue(true);
    clearRecoveryIntentMock.mockResolvedValue(undefined);
  });

  it("rejects a protocol-relative post-login redirect", async () => {
    signInWithPasswordMock.mockResolvedValue({ error: null });
    const formData = new FormData();
    formData.set("email", "staff@example.com");
    formData.set("password", "Password123!");
    formData.set("next", "//evil.example/steal");

    await signInAction({ error: null }, formData);

    expect(redirectMock).toHaveBeenCalledWith("/dashboard");
  });

  it("rejects malformed login input before contacting Supabase", async () => {
    const formData = new FormData();
    formData.set("email", "not-an-email");
    formData.set("password", "short");

    const result = await signInAction({ error: null }, formData);

    expect(result.error).toMatch(/valid email/i);
    expect(signInWithPasswordMock).not.toHaveBeenCalled();
  });

  it("uses a generic error when the identity provider rejects login", async () => {
    signInWithPasswordMock.mockResolvedValue({
      error: new Error("provider detail"),
    });
    const formData = new FormData();
    formData.set("email", "staff@example.com");
    formData.set("password", "Password123!");

    const result = await signInAction({ error: null }, formData);

    expect(result).toEqual({ error: "Invalid email or password" });
  });

  it("keeps the user on the protected app when sign-out fails", async () => {
    signOutMock.mockResolvedValue({ error: new Error("network details") });

    await signOutAction();

    expect(redirectMock).toHaveBeenCalledWith(
      "/dashboard?error=Unable%20to%20sign%20out.%20Please%20try%20again.",
    );
    expect(redirectMock).not.toHaveBeenCalledWith("/login");
  });

  it("redirects to login only after sign-out succeeds", async () => {
    signOutMock.mockResolvedValue({ error: null });

    await signOutAction();

    expect(redirectMock).toHaveBeenCalledWith("/login");
  });

  it("returns the same generic recovery response whether Supabase succeeds or fails", async () => {
    const formData = new FormData();
    formData.set("email", "staff@example.com");

    resetPasswordForEmailMock.mockResolvedValueOnce({ error: null });
    const success = await requestPasswordRecoveryAction(
      { message: null },
      formData,
    );
    resetPasswordForEmailMock.mockResolvedValueOnce({
      error: new Error("unknown email"),
    });
    const failure = await requestPasswordRecoveryAction(
      { message: null },
      formData,
    );

    expect(success).toEqual(failure);
    expect(success.message).toMatch(/if an account exists/i);
    expect(resetPasswordForEmailMock).toHaveBeenCalledWith(
      "staff@example.com",
      {
        redirectTo:
          "http://localhost:3000/auth/callback?next=%2Fupdate-password&type=recovery",
      },
    );
  });

  it("validates a recovery email before requesting delivery", async () => {
    const formData = new FormData();
    formData.set("email", "invalid");

    const result = await requestPasswordRecoveryAction(
      { message: null },
      formData,
    );

    expect(result.error).toMatch(/valid email/i);
    expect(resetPasswordForEmailMock).not.toHaveBeenCalled();
  });

  it("updates the authenticated recovery session password", async () => {
    updateUserMock.mockResolvedValue({ error: null });
    const formData = new FormData();
    formData.set("password", "NewParkingPassword123!");
    formData.set("confirmPassword", "NewParkingPassword123!");

    await updatePasswordAction({ error: null }, formData);

    expect(updateUserMock).toHaveBeenCalledWith({
      password: "NewParkingPassword123!",
    });
    expect(signOutMock).toHaveBeenCalledWith({ scope: "global" });
    expect(clearRecoveryIntentMock).toHaveBeenCalledOnce();
    expect(redirectMock).toHaveBeenCalledWith("/login?passwordUpdated=1");
  });

  it("rejects a password update outside a live recovery intent", async () => {
    hasRecoveryIntentMock.mockResolvedValue(false);
    const formData = new FormData();
    formData.set("password", "NewParkingPassword123!");
    formData.set("confirmPassword", "NewParkingPassword123!");

    const result = await updatePasswordAction({ error: null }, formData);

    expect(result.error).toMatch(/recovery session expired/i);
    expect(updateUserMock).not.toHaveBeenCalled();
  });

  it("does not report completion when prior sessions cannot be revoked", async () => {
    updateUserMock.mockResolvedValue({ error: null });
    signOutMock.mockResolvedValue({ error: new Error("provider detail") });
    const formData = new FormData();
    formData.set("password", "NewParkingPassword123!");
    formData.set("confirmPassword", "NewParkingPassword123!");

    const result = await updatePasswordAction({ error: null }, formData);

    expect(result.error).toMatch(/other sessions could not be revoked/i);
    expect(redirectMock).not.toHaveBeenCalledWith("/login?passwordUpdated=1");
  });

  it("uses a generic safe error when the password update fails", async () => {
    updateUserMock.mockResolvedValue({ error: new Error("token detail") });
    const formData = new FormData();
    formData.set("password", "NewParkingPassword123!");
    formData.set("confirmPassword", "NewParkingPassword123!");

    const result = await updatePasswordAction({ error: null }, formData);

    expect(result.error).toBe(
      "Unable to update password. Request a new recovery link.",
    );
  });

  it("rejects a weak password before updating the recovery user", async () => {
    const formData = new FormData();
    formData.set("password", "weak");
    formData.set("confirmPassword", "weak");

    const result = await updatePasswordAction({ error: null }, formData);

    expect(result.error).toMatch(/at least 12 characters/i);
    expect(updateUserMock).not.toHaveBeenCalled();
  });
});
