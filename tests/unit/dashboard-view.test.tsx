import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DashboardView } from "@/components/dashboard/dashboard-view";
import type { ActiveProfile } from "@/lib/auth/types";

const profile: ActiveProfile = {
  id: "00000000-0000-0000-0000-000000000001",
  parking_location_id: "00000000-0000-0000-0000-000000000002",
  role: "ADMIN",
  full_name: "Alex Johnson",
  is_active: true,
  disabled_at: null,
  permissions: {
    can_approve_overrides: true,
    can_void_payments: true,
    can_process_lost_tickets: true,
    can_correct_session_times: true,
    can_cancel_sessions: true,
  },
};

describe("DashboardView", () => {
  it("shows a truthful Phase 4 readiness state without fabricated metrics", () => {
    render(<DashboardView profile={profile} />);

    expect(
      screen.getByRole("heading", { name: "Dashboard" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Authentication")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Location access")).toBeInTheDocument();
    expect(screen.getByText("Assigned")).toBeInTheDocument();
    expect(screen.queryByText("$4,315.75")).not.toBeInTheDocument();
  });

  it("announces a safe sign-out failure to the authenticated user", () => {
    render(
      <DashboardView
        profile={profile}
        error="Unable to sign out. Please try again."
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Unable to sign out. Please try again.",
    );
  });
});
