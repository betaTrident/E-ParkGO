import { beforeEach, describe, expect, it, vi } from "vitest";

const { exchangeCodeForSessionMock } = vi.hoisted(() => ({
  exchangeCodeForSessionMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: vi.fn(async () => ({
    auth: { exchangeCodeForSession: exchangeCodeForSessionMock },
  })),
}));

import { GET } from "@/app/(auth)/auth/callback/route";

describe("auth callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects a protocol-relative callback destination", async () => {
    exchangeCodeForSessionMock.mockResolvedValue({ error: null });

    const response = await GET(
      new Request(
        "https://parking.example/auth/callback?code=valid&next=%2F%2Fevil.example%2Fsteal",
      ),
    );

    expect(response.headers.get("location")).toBe(
      "https://parking.example/dashboard",
    );
  });

  it("does not continue without a PKCE authorization code", async () => {
    const response = await GET(
      new Request("https://parking.example/auth/callback"),
    );

    expect(response.headers.get("location")).toBe(
      "https://parking.example/login?error=Authentication%20failed",
    );
    expect(exchangeCodeForSessionMock).not.toHaveBeenCalled();
  });

  it("continues to a valid local recovery destination after exchange", async () => {
    exchangeCodeForSessionMock.mockResolvedValue({ error: null });

    const response = await GET(
      new Request(
        "https://parking.example/auth/callback?code=valid&next=%2Fupdate-password&type=recovery",
      ),
    );

    expect(response.headers.get("location")).toBe(
      "https://parking.example/update-password",
    );
    expect(response.cookies.get("eparkgo-recovery-intent")?.value).toBe("1");
  });

  it("rejects an update-password callback that is not marked as recovery", async () => {
    const response = await GET(
      new Request(
        "https://parking.example/auth/callback?code=valid&next=%2Fupdate-password",
      ),
    );

    expect(response.headers.get("location")).toBe(
      "https://parking.example/login?error=Authentication%20failed",
    );
    expect(exchangeCodeForSessionMock).not.toHaveBeenCalled();
  });
});
