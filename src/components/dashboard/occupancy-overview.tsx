"use client";

import { ChevronDown, Info, TrendingUp } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import type { DashboardZoneSnapshot } from "@/features/dashboard/types";

interface OccupancyOverviewProps {
  zones?: DashboardZoneSnapshot[] | undefined;
}

const fallbackData = [
  { name: "Available", value: 342, percentage: "47.5%", color: "#34D399" },
  { name: "Occupied", value: 268, percentage: "37.2%", color: "#F87171" },
  { name: "Reserved", value: 68, percentage: "9.4%", color: "#FBBF24" },
  { name: "Maintenance", value: 42, percentage: "5.8%", color: "#9CA3AF" },
];

export function OccupancyOverview({ zones }: OccupancyOverviewProps) {
  const totalSpaces = zones?.length
    ? zones.reduce((acc, z) => acc + z.total_spaces, 0)
    : 720;

  return (
    <section
      aria-label="Occupancy Overview"
      className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
            Occupancy Overview
          </h2>
          <Info aria-hidden="true" className="size-4 text-slate-400" />
        </div>
        <button
          type="button"
          className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          <span>All Levels</span>
          <ChevronDown className="size-3.5 text-slate-500" />
        </button>
      </div>

      {/* Main Content: Donut + Legend */}
      <div className="mt-4 flex flex-col items-center justify-between gap-6 sm:flex-row">
        {/* Donut Chart with Center Label */}
        <div className="relative flex size-52 shrink-0 items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={fallbackData}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={95}
                startAngle={90}
                endAngle={-270}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {fallbackData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Total Spaces
            </span>
            <span className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {totalSpaces}
            </span>
            <span className="text-[11px] text-slate-400">100%</span>
          </div>
        </div>

        {/* Legend List */}
        <div className="w-full flex-1 space-y-3">
          {fallbackData.map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {item.name}
                </span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <span className="font-semibold text-slate-900 dark:text-white">
                  {item.value}
                </span>
                <span className="text-slate-400 dark:text-slate-500">
                  ({item.percentage})
                </span>
              </div>
            </div>
          ))}

          {/* Render Active Zones from props if available */}
          {zones && zones.length > 0 ? (
            <div className="mt-3 border-t border-slate-100 pt-2 text-xs dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400">Active Zones:</span>
              <div className="mt-1 flex flex-wrap gap-2">
                {zones.map((zone) => (
                  <span
                    key={zone.zone_id}
                    className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  >
                    <span>{zone.zone_name}</span>
                    <span className="text-slate-400">({zone.zone_code})</span>
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Footer summary bar */}
      <div className="mt-6 flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-800/50">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
            Occupancy Rate
          </span>
          <span className="text-base font-extrabold text-blue-600 dark:text-blue-400">
            52.5%
          </span>
        </div>
        <div className="flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
          <TrendingUp className="size-3.5" />
          <span>6.8%</span>
          <span className="font-normal text-emerald-600/80">vs yesterday</span>
        </div>
      </div>
    </section>
  );
}
