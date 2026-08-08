import { PageHeader } from "@/components/shared/page-header";
import { SectionPanel } from "@/components/shared/section-panel";
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
    <div className="page-root">
      <PageHeader
        title="Vehicle entry"
        description="Record plate and vehicle type against the facility capacity pool, issue a one-time QR ticket, and print it immediately."
      />

      {metrics ? (
        <EntryKpiStrip metrics={metrics} />
      ) : (
        <div className="panel p-4 text-xs text-muted-foreground">
          Live facility metrics are temporarily unavailable. You can still create an entry below.
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-2">
        <SectionPanel title="Issue ticket">
          <EntryForm
            vehicleTypes={vehicleTypes}
            poolCapacities={poolCapacities}
            poolRemaining={poolRemaining}
          />
        </SectionPanel>

        <EntryContextPanel snapshot={snapshot} />
      </div>
    </div>
  );
}
