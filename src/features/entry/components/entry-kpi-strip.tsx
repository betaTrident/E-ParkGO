import { Bike, Car, LogIn, type LucideIcon } from "lucide-react";

import type { DashboardMetrics } from "@/features/dashboard/types";
import { KpiCard } from "@/components/shared/kpi-card";

interface EntryKpiStripProps {
  metrics: DashboardMetrics;
}

interface KpiCardData {
  title: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  iconBg: string;
}

function buildCards(metrics: DashboardMetrics): KpiCardData[] {
  const carFree = Math.max(metrics.car_capacity - metrics.car_occupied, 0);
  const motorcycleFree = Math.max(
    metrics.motorcycle_capacity - metrics.motorcycle_occupied,
    0,
  );

  return [
    {
      title: "Cars free",
      value: `${carFree}/${metrics.car_capacity}`,
      hint: `${metrics.car_occupied} cars currently parked`,
      icon: Car,
      iconBg: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400",
    },
    {
      title: "Motorcycles free",
      value: `${motorcycleFree}/${metrics.motorcycle_capacity}`,
      hint: `${metrics.motorcycle_occupied} motorcycles currently parked`,
      icon: Bike,
      iconBg: "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400",
    },
    {
      title: "Entries today",
      value: String(metrics.entries_today),
      hint: `${metrics.exits_today} exits today`,
      icon: LogIn,
      iconBg: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400",
    },
    {
      title: "Active sessions",
      value: String(metrics.active_sessions),
      hint: `${metrics.payment_pending_sessions} pending payment`,
      icon: Car,
      iconBg: "bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400",
    },
  ];
}

export function EntryKpiStrip({ metrics }: EntryKpiStripProps) {
  const cards = buildCards(metrics);

  return (
    <section
      aria-label="Facility metrics"
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      {cards.map((card) => (
        <KpiCard
          key={card.title}
          title={card.title}
          value={card.value}
          hint={card.hint}
          icon={card.icon}
          iconBg={card.iconBg}
        />
      ))}
    </section>
  );
}
