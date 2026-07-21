"use client";

import type { ActiveProfile } from "@/lib/auth/types";
import type { DashboardSnapshot } from "@/features/dashboard/types";
import { MetricGrid } from "@/components/dashboard/metric-grid";
import { RealtimeStatus } from "@/components/dashboard/realtime-status";
import { ZoneOccupancy } from "@/components/dashboard/zone-occupancy";
import { useConnectivity } from "@/hooks/use-connectivity";
import { useDashboardRealtime } from "@/hooks/use-dashboard-realtime";
import { formatBusinessDateTime } from "@/lib/time/business-time";
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
    error,
    lastUpdatedAt,
    refresh,
  } = useDashboardRealtime({
    locationId: profile.parking_location_id,
    ...(initialSnapshot ? { initialSnapshot } : {}),
    enabled: true,
  });

  const data = snapshot ?? initialSnapshot;

  return (
    <div className="space-y-4 p-4 sm:p-6 xl:p-7">
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

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Welcome, {profile.full_name}
          </p>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          {data ? (
            <p className="text-xs text-slate-500">
              Business date {data.business_date} ·{" "}
              {formatBusinessDateTime(data.snapshot_at)}
            </p>
          ) : null}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => void probe()}>
          Check connection
        </Button>
      </header>

      <RealtimeStatus
        state={connectionState}
        {...(lastUpdatedAt ? { lastUpdatedAt } : {})}
        onRefresh={() => void refresh()}
        isRefreshing={isFetching}
        connectivity={connectivity}
      />

      {!data ? (
        <p className="text-sm text-slate-600">
          {error instanceof Error
            ? error.message
            : "Dashboard metrics are unavailable right now."}
        </p>
      ) : (
        <>
          <MetricGrid metrics={data.metrics} />
          <div className="grid gap-4 xl:grid-cols-2">
            <ZoneOccupancy zones={data.zones} />
            <section
              aria-label="Recent movements"
              className="rounded-xl border border-[#dce5f0] bg-white dark:border-slate-800 dark:bg-[#0d192a]"
            >
              <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                <h2 className="text-base font-semibold">Recent movements</h2>
              </div>
              {data.recent_movements.length === 0 ? (
                <p className="px-5 py-8 text-sm text-slate-500">
                  No entries or exits recorded for this business date yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[520px] text-left text-xs">
                    <thead className="bg-slate-50/70 text-slate-500 dark:bg-slate-900/50">
                      <tr>
                        {["Time", "Kind", "Plate", "Space", "Status"].map(
                          (heading) => (
                            <th key={heading} scope="col" className="px-4 py-3 font-medium">
                              {heading}
                            </th>
                          ),
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {data.recent_movements.map((movement) => (
                        <tr key={`${movement.session_id}-${movement.kind}-${movement.occurred_at}`}>
                          <td className="whitespace-nowrap px-4 py-3">
                            {formatBusinessDateTime(movement.occurred_at, "h:mm a")}
                          </td>
                          <td className="px-4 py-3 capitalize">{movement.kind}</td>
                          <td className="px-4 py-3 font-mono">{movement.plate_display}</td>
                          <td className="px-4 py-3">
                            {movement.zone_code}-{movement.space_code}
                          </td>
                          <td className="px-4 py-3">{movement.session_status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
