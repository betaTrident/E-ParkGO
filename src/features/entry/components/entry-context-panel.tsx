import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { SectionPanel } from "@/components/shared/section-panel";
import { StatusChip } from "@/components/shared/status-chip";
import type {
  DashboardMovement,
  DashboardSnapshot,
} from "@/features/dashboard/types";
import { formatBusinessDateTime } from "@/lib/time/business-time";

interface EntryContextPanelProps {
  snapshot: DashboardSnapshot | null;
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
      <p className="text-xs text-muted-foreground">
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
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-medium text-foreground">Cars</span>
        <span className="font-mono font-semibold text-muted-foreground">
          {carFree} / {metrics.car_capacity} free
        </span>
      </div>
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-medium text-foreground">Motorcycles</span>
        <span className="font-mono font-semibold text-muted-foreground">
          {motorcycleFree} / {metrics.motorcycle_capacity} free
        </span>
      </div>
    </div>
  );
}

export function EntryContextPanel({ snapshot }: EntryContextPanelProps) {
  const movements = selectMovements(snapshot?.recent_movements).slice(0, 8);

  return (
    <SectionPanel
      title="Recent activity"
      headerAction={
        <Link
          href="/sessions"
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          View sessions <ArrowRight className="size-3" />
        </Link>
      }
    >
      {movements.length === 0 ? (
        <p className="text-xs text-muted-foreground py-4">
          No recent movements recorded for this facility.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {movements.map((movement) => (
            <li
              key={`${movement.session_id}-${movement.occurred_at}`}
              className="flex items-center justify-between gap-2 py-3 first:pt-0 last:pb-0"
            >
              <div className="flex min-w-0 flex-col gap-1">
                <span className="ref-tag w-fit">{movement.plate_display}</span>
                {movement.space_code ? (
                  <span className="text-[11px] text-muted-foreground">
                    {movement.zone_code}-{movement.space_code}
                  </span>
                ) : null}
              </div>

              <div className="flex flex-col items-end gap-1">
                <span className="font-mono text-xs font-medium text-muted-foreground">
                  {formatBusinessDateTime(movement.occurred_at, "h:mm a")}
                </span>
                <StatusChip status={movement.session_status} />
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6 border-t border-border pt-4">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Capacity pools
        </h3>
        <div className="mt-2.5 rounded-md border border-border bg-muted/30 p-3">
          <PoolSummary snapshot={snapshot} />
        </div>
      </div>
    </SectionPanel>
  );
}
