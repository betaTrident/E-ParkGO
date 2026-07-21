import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { DashboardSnapshot } from "@/features/dashboard/types";
import type { ActiveProfile } from "@/lib/auth/types";

vi.mock("@/hooks/use-dashboard-realtime", () => ({
  useDashboardRealtime: ({
    initialSnapshot,
  }: {
    initialSnapshot?: DashboardSnapshot;
  }) => ({
    snapshot: initialSnapshot,
    isLoading: false,
    isFetching: false,
    error: null,
    connectionState: "live" as const,
    lastUpdatedAt: initialSnapshot?.snapshot_at,
    refresh: vi.fn(),
  }),
}));

vi.mock("@/hooks/use-connectivity", () => ({
  useConnectivity: () => ({
    status: "online" as const,
    probe: vi.fn(),
  }),
}));

import { DashboardView } from "@/components/dashboard/dashboard-view";

const profile: ActiveProfile = {
  id: "00000000-0000-0000-0000-000000000001",
  parking_location_id: "11111111-1111-4111-8111-111111111111",
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

const snapshot: DashboardSnapshot = {
  snapshot_at: "2026-07-21T10:00:00.000Z",
  business_date: "2026-07-21",
  aggregate_version: 1,
  location_id: profile.parking_location_id,
  timezone: "Asia/Manila",
  metrics: {
    total_capacity: 4,
    available_spaces: 3,
    occupied_spaces: 1,
    out_of_service_spaces: 0,
    operational_capacity: 4,
    occupancy_basis_points: 2500,
    active_sessions: 1,
    payment_pending_sessions: 0,
    paid_awaiting_exit_sessions: 0,
    lost_ticket_sessions: 0,
    manual_review_sessions: 0,
    entries_today: 1,
    exits_today: 0,
    revenue_today_centavos: 5000,
  },
  zones: [],
  recent_movements: [],
};

function renderDashboard() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <DashboardView profile={profile} initialSnapshot={snapshot} />
    </QueryClientProvider>,
  )
}

describe("DashboardView", () => {
  it("renders operational metrics from the canonical snapshot", () => {
    renderDashboard();

    expect(screen.getByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Operational metrics" })).toBeInTheDocument();
    expect(screen.getByText("Active sessions")).toBeInTheDocument();
  });

  it("announces a safe sign-out failure to the authenticated user", () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <DashboardView
          profile={profile}
          initialSnapshot={snapshot}
          signOutError="Unable to sign out. Please try again."
        />
      </QueryClientProvider>,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Unable to sign out. Please try again.",
    );
  });

  it("renders load errors and recent movements when present", () => {
    const movementSnapshot: DashboardSnapshot = {
      ...snapshot,
      recent_movements: [
        {
          session_id: "33333333-3333-4333-8333-333333333333",
          kind: "entry",
          occurred_at: "2026-07-21T09:30:00.000Z",
          plate_display: "ABC1234",
          zone_code: "A",
          space_code: "01",
          session_status: "ACTIVE",
        },
      ],
      zones: [
        {
          zone_id: "22222222-2222-4222-8222-222222222221",
          zone_code: "A",
          zone_name: "Zone A",
          total_spaces: 4,
          available_spaces: 3,
          occupied_spaces: 1,
          out_of_service_spaces: 0,
        },
      ],
    };

    render(
      <QueryClientProvider client={new QueryClient()}>
        <DashboardView
          profile={profile}
          initialSnapshot={movementSnapshot}
          loadError="Dashboard snapshot failed to load."
        />
      </QueryClientProvider>,
    );

    expect(screen.getByText("Dashboard snapshot failed to load.")).toBeInTheDocument();
    expect(screen.getByText("ABC1234")).toBeInTheDocument();
    expect(screen.getByText("Zone A")).toBeInTheDocument();
  });

  it("lets operators manually probe connectivity", async () => {
    const user = userEvent.setup();
    renderDashboard();

    await user.click(screen.getByRole("button", { name: "Check connection" }));
    expect(screen.getByRole("button", { name: "Check connection" })).toBeEnabled();
  });
});
