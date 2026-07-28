"use client";

import { ChevronDown, Info } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const data = [
  { day: "May 13", amount: 2600 },
  { day: "May 14", amount: 3300 },
  { day: "May 15", amount: 2800 },
  { day: "May 16", amount: 3500 },
  { day: "May 17", amount: 3100 },
  { day: "May 18", amount: 4100 },
  { day: "May 19", amount: 4315.75 },
];

export function RevenueTrend() {
  return (
    <section
      aria-label="Revenue Trend"
      className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
            Revenue Trend
          </h2>
          <Info aria-hidden="true" className="size-4 text-slate-400" />
        </div>
        <button
          type="button"
          className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          <span>7 Days</span>
          <ChevronDown className="size-3.5 text-slate-500" />
        </button>
      </div>

      {/* Line Chart */}
      <div className="relative mt-4 h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 35, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#F1F5F9"
            />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "#64748B" }}
              dy={10}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "#64748B" }}
              ticks={[0, 2000, 4000, 6000]}
              tickFormatter={(value) => `$${value / 1000}K`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload[0] && payload[0].payload) {
                  const item = payload[0].payload as { day: string; amount: number };
                  return (
                    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg dark:border-slate-800 dark:bg-slate-900">
                      <p className="text-[11px] font-medium text-slate-500">
                        {item.day}, 2025
                      </p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        ${Number(item.amount).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line
              type="monotone"
              dataKey="amount"
              stroke="#2563EB"
              strokeWidth={2.5}
              dot={{
                r: 4,
                fill: "#2563EB",
                stroke: "#FFFFFF",
                strokeWidth: 2,
              }}
              activeDot={{
                r: 6,
                fill: "#2563EB",
                stroke: "#FFFFFF",
                strokeWidth: 3,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend Indicator */}
      <div className="mt-4 flex items-center justify-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="relative flex items-center justify-center">
            <span className="h-0.5 w-4 bg-blue-600" />
            <span className="absolute size-2 rounded-full bg-blue-600" />
          </span>
          <span>Revenue (USD)</span>
        </span>
      </div>
    </section>
  );
}
