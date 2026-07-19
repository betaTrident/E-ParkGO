import { describe, expect, it } from "vitest";

import { getSafeRedirectPath } from "@/lib/auth/safe-redirect";

describe("getSafeRedirectPath", () => {
  it.each(["/dashboard", "/sessions?status=active", "/admin/staff#member"])(
    "accepts a local application path: %s",
    (path) => {
      expect(getSafeRedirectPath(path, "/dashboard")).toBe(path);
    },
  );

  it.each([
    "https://evil.example/steal",
    "http://evil.example/steal",
    "//evil.example/steal",
    "\\\\evil.example\\steal",
    "/\\evil.example/steal",
    "javascript:alert(1)",
    "dashboard",
    "",
    null,
  ])("rejects a non-local redirect target: %s", (path) => {
    expect(getSafeRedirectPath(path, "/dashboard")).toBe("/dashboard");
  });
});
