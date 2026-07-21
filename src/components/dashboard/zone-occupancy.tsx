import type { DashboardZoneSnapshot } from "@/features/dashboard/types";

interface ZoneOccupancyProps {
  zones: DashboardZoneSnapshot[];
}

const statusLegend = [
  { key: "available", label: "Available", className: "bg-emerald-500" },
  { key: "occupied", label: "Occupied", className: "bg-red-500" },
  { key: "out_of_service", label: "Out of service", className: "bg-slate-400" },
] as const;

export function ZoneOccupancy({ zones }: ZoneOccupancyProps) {
  if (zones.length === 0) {
    return (
      <section
        aria-label="Zone occupancy"
        className="rounded-xl border border-dashed border-slate-200 p-6 text-sm text-slate-500 dark:border-slate-700"
      >
        No active zones configured for this facility.
      </section>
    );
  }

  return (
    <section
      aria-label="Zone occupancy"
      className="rounded-xl border border-[#dce5f0] bg-white p-5 dark:border-slate-800 dark:bg-[#0d192a]"
    >
      <h2 className="text-base font-semibold">Zone occupancy</h2>
      <ul className="mt-4 space-y-4">
        {zones.map((zone) => {
          const total = Math.max(zone.total_spaces, 1);
          const availablePct = (zone.available_spaces / total) * 100;
          const occupiedPct = (zone.occupied_spaces / total) * 100;
          const oosPct = (zone.out_of_service_spaces / total) * 100;

          return (
            <li key={zone.zone_id}>
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="font-medium">
                  {zone.zone_name}{" "}
                  <span className="text-slate-500">({zone.zone_code})</span>
                </span>
                <span className="font-mono text-xs text-slate-600 dark:text-slate-300">
                  {zone.occupied_spaces}/{zone.total_spaces} occupied
                </span>
              </div>
              <div
                className="mt-2 flex h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
                role="img"
                aria-label={`${zone.zone_name}: ${zone.available_spaces} available, ${zone.occupied_spaces} occupied, ${zone.out_of_service_spaces} out of service`}
              >
                <span
                  className="bg-emerald-500"
                  style={{ width: `${availablePct}%` }}
                />
                <span
                  className="bg-red-500"
                  style={{ width: `${occupiedPct}%` }}
                />
                <span
                  className="bg-slate-400"
                  style={{ width: `${oosPct}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Available {zone.available_spaces} · Occupied {zone.occupied_spaces}{" "}
                · Out of service {zone.out_of_service_spaces}
              </p>
            </li>
          );
        })}
      </ul>
      <ul className="mt-6 flex flex-wrap gap-4 text-xs text-slate-600 dark:text-slate-300">
        {statusLegend.map((item) => (
          <li key={item.key} className="flex items-center gap-2">
            <span
              className={`size-3 rounded-full ${item.className}`}
              aria-hidden
            />
            {item.label}
          </li>
        ))}
      </ul>
    </section>
  );
}
