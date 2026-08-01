import {
  Bike,
  Car,
  CarFront,
  Clock3,
  DollarSign,
  LogIn,
} from "lucide-react";

import type { DashboardMetrics } from "@/features/dashboard/types";
import { formatCentavosPhp } from "@/lib/money/centavos";

interface MetricGridProps {
  metrics: DashboardMetrics;
}

function occupancyPercent(basisPoints: number): string {
  return `${(basisPoints / 100).toFixed(1)}%`;
}

const panelClass =
  "rounded-md border border-[#dce5f0] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.02)] dark:border-slate-800 dark:bg-[#0d192a]";

export function MetricGrid({ metrics }: MetricGridProps) {
  const carFree = Math.max(metrics.car_capacity - metrics.car_occupied, 0);
  const motorcycleFree = Math.max(
    metrics.motorcycle_capacity - metrics.motorcycle_occupied,
    0,
  );

  const cards = [
    {
      label: "Cars free",
      value: `${carFree}/${metrics.car_capacity}`,
      icon: Car,
      hint: `${metrics.car_occupied} cars currently parked`,
    },
    {
      label: "Motorcycles free",
      value: `${motorcycleFree}/${metrics.motorcycle_capacity}`,
      icon: Bike,
      hint: `${metrics.motorcycle_occupied} motorcycles currently parked`,
    },
    {
      label: "Active sessions",
      value: String(metrics.active_sessions),
      icon: CarFront,
      hint: `${metrics.payment_pending_sessions} pending payment`,
    },
    {
      label: "Today's revenue",
      value: formatCentavosPhp(String(metrics.revenue_today_centavos)),
      icon: DollarSign,
      hint: "Non-voided collections for business date",
    },
    {
      label: "Entries today",
      value: String(metrics.entries_today),
      icon: LogIn,
      hint: `${metrics.exits_today} exits recorded`,
    },
    {
      label: "Occupancy",
      value: occupancyPercent(metrics.occupancy_basis_points),
      icon: Clock3,
      hint: `${metrics.occupied_spaces} of ${metrics.operational_capacity} pool slots occupied`,
    },
  ] as const;

  return (
    <section
      aria-label="Operational metrics"
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
    >
      {cards.map(({ label, value, icon: Icon, hint }) => (
        <article key={label} className={panelClass}>
          <div className="flex items-start gap-3 motion-reduce:transition-none">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
              <Icon aria-hidden className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                {label}
              </p>
              <p className="mt-1 font-mono text-2xl font-bold tracking-tight">
                {value}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {hint}
              </p>
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}
