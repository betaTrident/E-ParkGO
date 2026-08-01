"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import type { DashboardMetrics } from "@/features/dashboard/types";

interface OccupancyOverviewProps {
  metrics?: DashboardMetrics | undefined;
}

function buildChartData(metrics: DashboardMetrics) {
  const carFree = Math.max(metrics.car_capacity - metrics.car_occupied, 0);
  const motorcycleFree = Math.max(
    metrics.motorcycle_capacity - metrics.motorcycle_occupied,
    0,
  );
  const totalCapacity = metrics.car_capacity + metrics.motorcycle_capacity;
  const totalOccupied = metrics.car_occupied + metrics.motorcycle_occupied;
  const totalFree = carFree + motorcycleFree;

  const toPercent = (value: number) =>
    totalCapacity > 0 ? `${((value / totalCapacity) * 100).toFixed(1)}%` : "0.0%";

  return {
    totalCapacity,
    occupancyRate:
      totalCapacity > 0
        ? `${((totalOccupied / totalCapacity) * 100).toFixed(1)}%`
        : "0.0%",
    segments: [
      {
        name: "Cars free",
        value: carFree,
        percentage: toPercent(carFree),
        color: "#34D399",
      },
      {
        name: "Motorcycles free",
        value: motorcycleFree,
        percentage: toPercent(motorcycleFree),
        color: "#60A5FA",
      },
      {
        name: "Cars occupied",
        value: metrics.car_occupied,
        percentage: toPercent(metrics.car_occupied),
        color: "#F87171",
      },
      {
        name: "Motorcycles occupied",
        value: metrics.motorcycle_occupied,
        percentage: toPercent(metrics.motorcycle_occupied),
        color: "#FBBF24",
      },
    ].filter((segment) => segment.value > 0),
    summary: { carFree, motorcycleFree, totalFree, totalOccupied },
  };
}

export function OccupancyOverview({ metrics }: OccupancyOverviewProps) {
  if (!metrics) {
    return (
      <section
        aria-label="Occupancy Overview"
        className="rounded-md border border-slate-200/80 bg-white p-5 text-sm text-slate-500 shadow-xs dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
      >
        Pool occupancy data is temporarily unavailable.
      </section>
    );
  }

  const chart = buildChartData(metrics);
  const chartData =
    chart.segments.length > 0
      ? chart.segments
      : [{ name: "Empty", value: 1, percentage: "0.0%", color: "#E2E8F0" }];

  return (
    <section
      aria-label="Occupancy Overview"
      className="flex flex-col justify-between rounded-md border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
          Pool occupancy
        </h2>
      </div>

      <div className="mt-4 flex flex-col items-center justify-between gap-6 sm:flex-row">
        <div className="relative flex size-52 shrink-0 items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
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
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Total capacity
            </span>
            <span className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {chart.totalCapacity}
            </span>
            <span className="text-[11px] text-slate-400">{chart.occupancyRate} occupied</span>
          </div>
        </div>

        <div className="w-full flex-1 space-y-3">
          {chart.segments.map((item) => (
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
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between rounded-md border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-800/50">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
            Occupancy rate
          </span>
          <span className="text-base font-extrabold text-blue-600 dark:text-blue-400">
            {chart.occupancyRate}
          </span>
        </div>
        <div className="text-xs font-medium text-slate-600 dark:text-slate-300">
          {chart.summary.totalFree} free · {chart.summary.totalOccupied} occupied
        </div>
      </div>
    </section>
  );
}
