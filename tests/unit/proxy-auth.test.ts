import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

const { updateSessionMock } = vi.hoisted(() => ({
  updateSessionMock: vi.fn(),
}));

vi.mock("@/lib/supabase/session", () => ({ updateSession: updateSessionMock }));

import { proxy } from "@/proxy";

describe("auth proxy routing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps login reachable when a user cookie exists", async () => {
    updateSessionMock.mockResolvedValue({
      response: NextResponse.next(),
      user: { id: "inactive-user" },
    });

    const response = await proxy(
      new NextRequest("https://parking.example/login"),
    );

    expect(response.headers.get("location")).toBeNull();
  });

  it("keeps password recovery public", async () => {
    updateSessionMock.mockResolvedValue({
      response: NextResponse.next(),
      user: null,
    });

    const response = await proxy(
      new NextRequest("https://parking.example/forgot-password"),
    );

    expect(response.headers.get("location")).toBeNull();
  });

  it("sends unauthenticated protected requests to login with a local next path", async () => {
    updateSessionMock.mockResolvedValue({
      response: NextResponse.next(),
      user: null,
    });

    const response = await proxy(
      new NextRequest("https://parking.example/sessions"),
    );

    expect(response.headers.get("location")).toBe(
      "https://parking.example/login?next=%2Fsessions",
    );
  });

  it("preserves query state in the validated post-login path", async () => {
    updateSessionMock.mockResolvedValue({
      response: NextResponse.next(),
      user: null,
    });

    const response = await proxy(
      new NextRequest("https://parking.example/sessions?status=active&page=2"),
    );

    expect(response.headers.get("location")).toBe(
      "https://parking.example/login?next=%2Fsessions%3Fstatus%3Dactive%26page%3D2",
    );
  });

  it("adds a nonce-based content security policy", async () => {
    updateSessionMock.mockResolvedValue({
      response: NextResponse.next(),
      user: null,
    });

    const response = await proxy(
      new NextRequest("https://parking.example/login"),
    );

    expect(response.headers.get("content-security-policy")).toMatch(
      /script-src 'self' 'nonce-[^']+' 'strict-dynamic'/,
    );
  });
});
