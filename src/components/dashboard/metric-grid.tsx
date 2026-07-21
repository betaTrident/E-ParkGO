import {
  CarFront,
  CircleParking,
  Clock3,
  DollarSign,
  LogIn,
  LogOut,
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
  "rounded-xl border border-[#dce5f0] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.02)] dark:border-slate-800 dark:bg-[#0d192a]";

export function MetricGrid({ metrics }: MetricGridProps) {
  const cards = [
    {
      label: "Active sessions",
      value: String(metrics.active_sessions),
      icon: CarFront,
      hint: `${metrics.payment_pending_sessions} pending payment`,
    },
    {
      label: "Available spaces",
      value: String(metrics.available_spaces),
      icon: CircleParking,
      hint: `${metrics.occupied_spaces} occupied of ${metrics.operational_capacity} operational`,
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
      label: "Paid awaiting exit",
      value: String(metrics.paid_awaiting_exit_sessions),
      icon: Clock3,
      hint: `${metrics.lost_ticket_sessions} lost ticket · ${metrics.manual_review_sessions} manual review`,
    },
    {
      label: "Occupancy",
      value: occupancyPercent(metrics.occupancy_basis_points),
      icon: LogOut,
      hint: `${metrics.out_of_service_spaces} out of service`,
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
