import { describe, expect, it } from "vitest";

import {
  loginSchema,
  passwordRecoverySchema,
  passwordUpdateSchema,
} from "@/features/auth/schemas";

describe("loginSchema", () => {
  it("accepts valid credentials", () => {
    const result = loginSchema.safeParse({
      email: "staff@eparkgo.local",
      password: "Staff123!@#",
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "Staff123!@#",
    });

    expect(result.success).toBe(false);
  });

  it("rejects short passwords", () => {
    const result = loginSchema.safeParse({
      email: "staff@eparkgo.local",
      password: "short",
    });

    expect(result.success).toBe(false);
  });
});

describe("passwordRecoverySchema", () => {
  it("normalizes a valid email address", () => {
    const result = passwordRecoverySchema.safeParse({
      email: "  Staff@Example.COM ",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("staff@example.com");
    }
  });

  it("rejects malformed email addresses", () => {
    expect(passwordRecoverySchema.safeParse({ email: "staff" }).success).toBe(
      false,
    );
  });
});

describe("passwordUpdateSchema", () => {
  it("accepts a strong matching password", () => {
    expect(
      passwordUpdateSchema.safeParse({
        password: "NewParkingPassword123!",
        confirmPassword: "NewParkingPassword123!",
      }).success,
    ).toBe(true);
  });

  it.each([
    ["too short", "Short1!", "Short1!"],
    ["missing uppercase", "parkingpassword123!", "parkingpassword123!"],
    ["missing lowercase", "PARKINGPASSWORD123!", "PARKINGPASSWORD123!"],
    ["missing number", "ParkingPassword!", "ParkingPassword!"],
    ["missing symbol", "ParkingPassword123", "ParkingPassword123"],
    ["does not match", "ParkingPassword123!", "DifferentPassword123!"],
  ])("rejects a password that is %s", (_reason, password, confirmPassword) => {
    expect(
      passwordUpdateSchema.safeParse({ password, confirmPassword }).success,
    ).toBe(false);
  });
});
