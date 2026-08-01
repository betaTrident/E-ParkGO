import Link from "next/link";

import type {
  DashboardMovement,
  DashboardSnapshot,
} from "@/features/dashboard/types";
import { formatBusinessDateTime } from "@/lib/time/business-time";

interface EntryContextPanelProps {
  snapshot: DashboardSnapshot | null;
}

function formatSessionStatus(status: string): string {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function statusPillClass(status: string): string {
  if (status === "ACTIVE") {
    return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400";
  }

  if (status === "PAYMENT_PENDING" || status === "EXIT_PENDING") {
    return "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400";
  }

  if (status === "PAID_AWAITING_EXIT") {
    return "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400";
  }

  return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
}

function selectMovements(
  movements: DashboardMovement[] | undefined,
): DashboardMovement[] {
  if (!movements || movements.length === 0) {
    return [];
  }

  const entries = movements.filter((movement) => movement.kind === "entry");
  return entries.length > 0 ? entries : movements;
}

function PoolSummary({ snapshot }: { snapshot: DashboardSnapshot | null }) {
  const metrics = snapshot?.metrics;

  if (!metrics) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Pool capacity data is unavailable.
      </p>
    );
  }

  const carFree = Math.max(metrics.car_capacity - metrics.car_occupied, 0);
  const motorcycleFree = Math.max(
    metrics.motorcycle_capacity - metrics.motorcycle_occupied,
    0,
  );

  return (
    <ul className="space-y-2">
      <li className="flex items-center justify-between gap-3 rounded-md border border-slate-100 bg-slate-50/60 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-800/40">
        <span className="font-medium text-slate-700 dark:text-slate-200">Cars</span>
        <span className="font-mono text-xs font-semibold text-slate-600 dark:text-slate-300">
          {carFree}/{metrics.car_capacity} free
        </span>
      </li>
      <li className="flex items-center justify-between gap-3 rounded-md border border-slate-100 bg-slate-50/60 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-800/40">
        <span className="font-medium text-slate-700 dark:text-slate-200">
          Motorcycles
        </span>
        <span className="font-mono text-xs font-semibold text-slate-600 dark:text-slate-300">
          {motorcycleFree}/{metrics.motorcycle_capacity} free
        </span>
      </li>
    </ul>
  );
}

export function EntryContextPanel({ snapshot }: EntryContextPanelProps) {
  const movements = selectMovements(snapshot?.recent_movements).slice(0, 8);

  return (
    <section
      aria-label="Recent activity"
      className="rounded-md border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
          Recent activity
        </h2>
        <Link
          href="/sessions"
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          View sessions
        </Link>
      </div>

      {movements.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
          No recent movements recorded for this facility.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-slate-100 dark:divide-slate-800/60">
          {movements.map((movement) => (
            <li
              key={`${movement.session_id}-${movement.occurred_at}`}
              className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0"
            >
              <div className="flex min-w-0 flex-col gap-1">
                <span className="inline-block w-fit rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-[11px] font-semibold tracking-wider text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {movement.plate_display}
                </span>
                {movement.space_code ? (
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {movement.zone_code}-{movement.space_code}
                  </span>
                ) : null}
              </div>

              <div className="flex flex-col items-end gap-1">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  {formatBusinessDateTime(movement.occurred_at, "h:mm a")}
                </span>
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusPillClass(movement.session_status)}`}
                >
                  {formatSessionStatus(movement.session_status)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6 border-t border-slate-100 pt-5 dark:border-slate-800">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
          Capacity pools
        </h3>
        <div className="mt-3">
          <PoolSummary snapshot={snapshot} />
        </div>
      </div>
    </section>
  );
}
