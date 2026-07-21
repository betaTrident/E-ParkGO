import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MetricGrid } from "@/components/dashboard/metric-grid";
import { RealtimeStatus } from "@/components/dashboard/realtime-status";
import type { DashboardMetrics } from "@/features/dashboard/types";

const metrics: DashboardMetrics = {
  total_capacity: 12,
  available_spaces: 8,
  occupied_spaces: 3,
  out_of_service_spaces: 1,
  operational_capacity: 11,
  occupancy_basis_points: 2727,
  active_sessions: 3,
  payment_pending_sessions: 1,
  paid_awaiting_exit_sessions: 0,
  lost_ticket_sessions: 0,
  manual_review_sessions: 0,
  entries_today: 5,
  exits_today: 2,
  revenue_today_centavos: 15000,
};

describe("dashboard components", () => {
  it("renders metric labels and values accessibly", () => {
    render(<MetricGrid metrics={metrics} />);

    expect(screen.getByRole("region", { name: "Operational metrics" })).toBeInTheDocument();
    expect(screen.getByText("Active sessions")).toBeInTheDocument();
    expect(screen.getByText("27.3%")).toBeInTheDocument();
  });

  it("announces realtime status and refresh control", () => {
    render(
      <RealtimeStatus
        state="stale"
        lastUpdatedAt="2026-07-21T10:00:00.000Z"
        onRefresh={vi.fn()}
      />,
    );

    expect(screen.getByText(/Status:/)).toHaveTextContent("Stale");
    expect(screen.getByRole("button", { name: /Refresh/i })).toBeInTheDocument();
    expect(screen.getByText(/since/)).toBeInTheDocument();
  });

  it("reflects offline connectivity and disabled refresh controls", () => {
    render(
      <RealtimeStatus
        state="live"
        connectivity="offline"
        onRefresh={vi.fn()}
        isRefreshing
      />,
    );

    expect(screen.getByText(/Status:/)).toHaveTextContent("Offline");
    expect(screen.getByRole("button", { name: /Refresh/i })).toBeDisabled();
  });

  it("shows live connectivity styling", () => {
    render(<RealtimeStatus state="live" onRefresh={vi.fn()} />);

    expect(screen.getByText(/Status:/)).toHaveTextContent("Live");
  });
});
