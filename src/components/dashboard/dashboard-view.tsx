"use client";

import type { ActiveProfile } from "@/lib/auth/types";
import type { DashboardSnapshot } from "@/features/dashboard/types";
import { KPIStatCards } from "@/components/dashboard/kpi-stat-cards";
import { OccupancyOverview } from "@/components/dashboard/occupancy-overview";
import { RevenueTrend } from "@/components/dashboard/revenue-trend";
import { RecentEntriesTable } from "@/components/dashboard/recent-entries-table";
import { SpaceMapGrid } from "@/components/dashboard/space-map-grid";
import { RealtimeStatus } from "@/components/dashboard/realtime-status";
import { useConnectivity } from "@/hooks/use-connectivity";
import { useDashboardRealtime } from "@/hooks/use-dashboard-realtime";
import { Button } from "@/components/ui/button";

interface DashboardViewProps {
  profile: ActiveProfile;
  initialSnapshot: DashboardSnapshot | null;
  loadError?: string;
  signOutError?: string;
}

export function DashboardView({
  profile,
  initialSnapshot,
  loadError,
  signOutError,
}: DashboardViewProps) {
  const { status: connectivity, probe } = useConnectivity();
  const {
    snapshot,
    connectionState,
    isFetching,
    lastUpdatedAt,
    refresh,
  } = useDashboardRealtime({
    locationId: profile.parking_location_id,
    ...(initialSnapshot ? { initialSnapshot } : {}),
    enabled: true,
  });

  const data = snapshot ?? initialSnapshot;

  return (
    <div className="space-y-5 p-4 sm:p-6 xl:p-7">
      <h1 className="sr-only">Dashboard</h1>

      {signOutError ? (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
        >
          {signOutError}
        </p>
      ) : null}

      {loadError ? (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {loadError}
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <div className="flex-1">
          <RealtimeStatus
            state={connectionState}
            {...(lastUpdatedAt ? { lastUpdatedAt } : {})}
            onRefresh={() => void refresh()}
            isRefreshing={isFetching}
            connectivity={connectivity}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void probe()}
          className="hidden shrink-0 sm:inline-flex"
        >
          Check connection
        </Button>
      </div>

      {/* Row 1: KPI Stat Cards */}
      <KPIStatCards metrics={data?.metrics} />

      {/* Row 2: Analytics & Overview (Occupancy Donut + Revenue Line Chart) */}
      <div className="grid gap-5 xl:grid-cols-2">
        <OccupancyOverview zones={data?.zones} />
        <RevenueTrend />
      </div>

      {/* Row 3: Operational Data (Recent Entries Table + Space Map Grid) */}
      <div className="grid gap-5 xl:grid-cols-2">
        <RecentEntriesTable snapshot={data} />
        <SpaceMapGrid />
      </div>

      {/* Footer */}
      <footer className="mt-8 border-t border-slate-200/60 pt-6 text-center text-xs font-medium text-slate-400 dark:border-slate-800 dark:text-slate-500">
        © 2025 E-ParkGO. All rights reserved.
      </footer>
    </div>
  );
}
