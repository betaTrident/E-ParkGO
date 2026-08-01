import type { DashboardMetrics, DashboardSnapshot } from "@/features/dashboard/types";
import { EntryContextPanel } from "@/features/entry/components/entry-context-panel";
import {
  EntryForm,
  type PoolCapacities,
} from "@/features/entry/components/entry-form";
import { EntryKpiStrip } from "@/features/entry/components/entry-kpi-strip";
import type { VehicleTypeRecord } from "@/features/spaces/service";

interface EntryPageViewProps {
  vehicleTypes: VehicleTypeRecord[];
  snapshot: DashboardSnapshot | null;
}

function resolvePoolKey(code: string): keyof PoolCapacities {
  return code === "MOTO" ? "motorcycle" : "car";
}

function buildPoolCapacities(metrics: DashboardMetrics): PoolCapacities {
  return {
    car: {
      capacity: metrics.car_capacity,
      occupied: metrics.car_occupied,
    },
    motorcycle: {
      capacity: metrics.motorcycle_capacity,
      occupied: metrics.motorcycle_occupied,
    },
  };
}

function buildPoolRemaining(
  vehicleTypes: VehicleTypeRecord[],
  metrics: DashboardMetrics,
): Record<string, number> {
  const poolCapacities = buildPoolCapacities(metrics);

  return Object.fromEntries(
    vehicleTypes.map((type) => {
      const pool = poolCapacities[resolvePoolKey(type.code)];
      return [type.id, Math.max(pool.capacity - pool.occupied, 0)];
    }),
  );
}

export function EntryPageView({
  vehicleTypes,
  snapshot,
}: EntryPageViewProps) {
  const metrics = snapshot?.metrics;
  const poolCapacities = metrics
    ? buildPoolCapacities(metrics)
    : {
        car: { capacity: 0, occupied: 0 },
        motorcycle: { capacity: 0, occupied: 0 },
      };
  const poolRemaining =
    metrics && vehicleTypes.length > 0
      ? buildPoolRemaining(vehicleTypes, metrics)
      : {};

  return (
    <div className="space-y-5 p-4 sm:p-6 xl:p-7">
      <header className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          Vehicle entry
        </h1>
        <p className="max-w-2xl text-sm text-slate-500 dark:text-slate-400">
          Record plate and vehicle type, issue a one-time QR ticket, and print
          it immediately. Payment is collected at exit only.
        </p>
      </header>

      {metrics ? (
        <EntryKpiStrip metrics={metrics} />
      ) : (
        <p
          role="status"
          className="rounded-lg border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300"
        >
          Live facility metrics are temporarily unavailable. You can still create
          an entry below.
        </p>
      )}

      <div className="grid gap-5 xl:grid-cols-2">
        <section
          aria-label="Issue ticket"
          className="rounded-md border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900"
        >
          <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
            Issue ticket
          </h2>
          <div className="mt-5">
            <EntryForm
              vehicleTypes={vehicleTypes}
              poolCapacities={poolCapacities}
              poolRemaining={poolRemaining}
            />
          </div>
        </section>

        <EntryContextPanel snapshot={snapshot} />
      </div>
    </div>
  );
}
