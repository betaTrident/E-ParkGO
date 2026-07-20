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
  it("renders the reference dashboard as clearly labeled preview data", () => {
    render(<DashboardView profile={profile} />);

    expect(
      screen.getByRole("heading", { name: "Dashboard" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Active Sessions")).toBeInTheDocument();
    expect(screen.getByText("Occupancy Overview")).toBeInTheDocument();
    expect(screen.getByText("Recent Entries")).toBeInTheDocument();
    expect(
      screen.getByText(/Preview metrics are illustrative/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: /Seven day revenue preview/ }),
    ).toBeInTheDocument();
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
