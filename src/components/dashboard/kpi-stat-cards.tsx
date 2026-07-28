"use client";

import {
  Car,
  CircleParking,
  DollarSign,
  MoreVertical,
  TrendingUp,
} from "lucide-react";
import type { DashboardMetrics } from "@/features/dashboard/types";
import { formatCentavosPhp } from "@/lib/money/centavos";

interface KPIStatCardsProps {
  metrics?: DashboardMetrics | undefined;
}

export function KPIStatCards({ metrics }: KPIStatCardsProps) {
  const cards = [
    {
      title: "Active sessions",
      value: metrics ? String(metrics.active_sessions) : "128",
      trend: "12.5%",
      trendDirection: "up",
      icon: Car,
      iconBg: "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400",
    },
    {
      title: "Available spaces",
      value: metrics ? String(metrics.available_spaces) : "342",
      trend: "8.3%",
      trendDirection: "up",
      icon: CircleParking,
      iconBg: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400",
    },
    {
      title: "Today's revenue",
      value: metrics
        ? formatCentavosPhp(String(metrics.revenue_today_centavos))
        : "$4,315.75",
      trend: "16.7%",
      trendDirection: "up",
      icon: DollarSign,
      iconBg: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400",
    },
    {
      title: "Vehicles today",
      value: metrics ? String(metrics.entries_today) : "615",
      trend: "10.2%",
      trendDirection: "up",
      icon: Car,
      iconBg: "bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400",
    },
  ];

  return (
    <section aria-label="Operational metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <article
            key={card.title}
            className="relative rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-start justify-between">
              <span
                className={`flex size-14 shrink-0 items-center justify-center rounded-2xl ${card.iconBg}`}
              >
                <Icon className="size-7" />
              </span>
              <button
                type="button"
                aria-label={`Options for ${card.title}`}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <MoreVertical className="size-5" />
              </button>
            </div>

            <div className="mt-4">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {card.title}
              </p>
              <p className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {card.value}
              </p>
              <div className="mt-2.5 flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="size-3.5" />
                <span>{card.trend}</span>
                <span className="font-normal text-slate-400 dark:text-slate-500">
                  vs yesterday
                </span>
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}
