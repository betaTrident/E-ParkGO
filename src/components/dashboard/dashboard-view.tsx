import {
  CarFront,
  CircleParking,
  DollarSign,
  EllipsisVertical,
  Info,
  TrendingUp,
} from "lucide-react";

import type { ActiveProfile } from "@/lib/auth/types";

interface DashboardViewProps {
  profile: ActiveProfile;
  error?: string;
}

const metrics = [
  {
    label: "Active Sessions",
    value: "128",
    trend: "12.5%",
    icon: CarFront,
    tone: "blue",
  },
  {
    label: "Available Spaces",
    value: "342",
    trend: "8.3%",
    icon: CircleParking,
    tone: "green",
  },
  {
    label: "Today's Revenue",
    value: "₱4,315.75",
    trend: "16.7%",
    icon: DollarSign,
    tone: "blue",
  },
  {
    label: "Vehicles Today",
    value: "615",
    trend: "10.2%",
    icon: CarFront,
    tone: "violet",
  },
] as const;

const occupancy = [
  { label: "Available", value: 342, percent: "47.5%", color: "bg-emerald-500" },
  { label: "Occupied", value: 268, percent: "37.2%", color: "bg-red-500" },
  { label: "Reserved", value: 68, percent: "9.4%", color: "bg-amber-400" },
  { label: "Maintenance", value: 42, percent: "5.8%", color: "bg-slate-300" },
] as const;

const entries = [
  [
    "10:24 AM",
    "ABC-1234",
    "Toyota RAV4",
    "Gate A",
    "Level 2",
    "01h 15m",
    "Active",
  ],
  [
    "10:21 AM",
    "XYZ-9876",
    "Honda CR-V",
    "Gate B",
    "Level 1",
    "00h 42m",
    "Active",
  ],
  [
    "10:18 AM",
    "LMN-4567",
    "Tesla Model 3",
    "Gate A",
    "Level 3",
    "01h 02m",
    "Active",
  ],
  [
    "10:15 AM",
    "DEF-2345",
    "Ford Escape",
    "Gate C",
    "Level 2",
    "00h 30m",
    "Reserved",
  ],
  [
    "10:12 AM",
    "GHI-7890",
    "Chevrolet Malibu",
    "Gate B",
    "Level 1",
    "00h 50m",
    "Active",
  ],
] as const;

const parkingSpaces = [
  "accessible",
  "available",
  "available",
  "available",
  "available",
  "occupied",
  "available",
  "available",
  "available",
  "occupied",
  "available",
  "available",
  "available",
  "occupied",
  "occupied",
  "available",
  "available",
  "reserved",
  "available",
  "available",
  "occupied",
  "occupied",
  "available",
  "available",
  "available",
  "occupied",
  "available",
  "available",
  "available",
  "accessible",
  "available",
  "available",
  "available",
  "available",
  "available",
  "maintenance",
  "available",
  "occupied",
  "occupied",
  "available",
  "occupied",
  "available",
  "occupied",
  "available",
  "available",
  "available",
  "available",
  "available",
  "occupied",
  "available",
] as const;

const mapTone = {
  available:
    "border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-500/10",
  occupied: "border-red-400 bg-red-50 dark:border-red-700 dark:bg-red-500/10",
  reserved:
    "border-amber-400 bg-amber-50 dark:border-amber-700 dark:bg-amber-500/10",
  maintenance:
    "border-slate-300 bg-slate-100 dark:border-slate-600 dark:bg-slate-700/40",
  accessible:
    "border-blue-400 bg-blue-50 dark:border-blue-600 dark:bg-blue-500/10",
} as const;

const panelClass =
  "rounded-xl border border-[#dce5f0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.02)] dark:border-slate-800 dark:bg-[#0d192a]";

export function DashboardView({ profile, error }: DashboardViewProps) {
  return (
    <div className="space-y-4 p-4 sm:p-6 xl:p-7">
      {error ? (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
        >
          {error}
        </p>
      ) : null}

      <div className="flex items-center justify-between lg:hidden">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Welcome, {profile.full_name}
          </p>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
          Preview data
        </span>
      </div>

      <p className="sr-only">
        The metrics on this screen are representative dashboard preview data
        until Phase 5 data services are connected.
      </p>

      <section
        aria-label="Parking performance preview"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {metrics.map(({ label, value, trend, icon: Icon, tone }) => (
          <article
            key={label}
            className={`${panelClass} flex min-h-[120px] items-center gap-4 p-4`}
          >
            <span
              className={`flex size-[62px] shrink-0 items-center justify-center rounded-full ${tone === "green" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10" : tone === "violet" ? "bg-violet-50 text-violet-600 dark:bg-violet-500/10" : "bg-blue-50 text-blue-600 dark:bg-blue-500/10"}`}
            >
              <Icon aria-hidden="true" className="size-7" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className="truncate text-sm font-medium">{label}</p>
                <EllipsisVertical
                  aria-hidden="true"
                  className="size-4 shrink-0 text-slate-400"
                />
              </div>
              <p className="mt-1 font-mono text-[26px] font-bold leading-none tracking-tight">
                {value}
              </p>
              <p className="mt-2 flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                <TrendingUp
                  aria-hidden="true"
                  className="size-3.5 text-emerald-600"
                />
                <span className="font-semibold text-emerald-600">{trend}</span>{" "}
                vs yesterday
              </p>
            </div>
          </article>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.85fr_1fr]">
        <article className={`${panelClass} p-5`}>
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              Occupancy Overview{" "}
              <Info
                aria-label="Preview information"
                className="size-4 text-slate-400"
              />
            </h2>
            <span className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium dark:border-slate-700">
              All Levels⌄
            </span>
          </div>
          <div className="mt-5 grid items-center gap-6 sm:grid-cols-[0.9fr_1.1fr]">
            <div
              className="relative mx-auto size-48 rounded-full"
              style={{
                background:
                  "conic-gradient(#40c982 0 47.5%, #ff4d4f 47.5% 84.7%, #fbb324 84.7% 94.1%, #cbd5e1 94.1% 100%)",
              }}
            >
              <div className="absolute inset-[34px] flex flex-col items-center justify-center rounded-full bg-white dark:bg-[#0d192a]">
                <span className="text-xs text-slate-500">Total Spaces</span>
                <strong className="font-mono text-3xl">720</strong>
                <span className="text-xs text-slate-500">100%</span>
              </div>
            </div>
            <dl className="space-y-4">
              {occupancy.map((item) => (
                <div
                  key={item.label}
                  className="grid grid-cols-[auto_1fr_auto] items-center gap-3 text-xs sm:text-sm"
                >
                  <span className={`size-3 rounded-full ${item.color}`} />
                  <dt>{item.label}</dt>
                  <dd className="font-mono font-semibold">
                    {item.value}{" "}
                    <span className="font-sans font-normal text-slate-500">
                      ({item.percent})
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-sm dark:border-slate-800">
            <span>
              Occupancy Rate{" "}
              <strong className="ml-3 font-mono text-xl text-blue-600">
                52.5%
              </strong>
            </span>
            <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
              ↗ 6.8% vs yesterday
            </span>
          </div>
        </article>

        <article className={`${panelClass} p-5`}>
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              Revenue Trend{" "}
              <Info
                aria-label="Preview information"
                className="size-4 text-slate-400"
              />
            </h2>
            <span className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium dark:border-slate-700">
              7 Days⌄
            </span>
          </div>
          <div className="mt-4 min-h-64 overflow-hidden">
            <svg
              viewBox="0 0 620 260"
              role="img"
              aria-labelledby="revenue-chart-title"
              className="h-full min-h-64 w-full"
            >
              <title id="revenue-chart-title">
                Seven day revenue preview rising from about 2,400 to 4,300 pesos
              </title>
              <defs>
                <linearGradient id="revenue-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1570ef" stopOpacity=".18" />
                  <stop offset="100%" stopColor="#1570ef" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[38, 98, 158, 218].map((y) => (
                <line
                  key={y}
                  x1="45"
                  y1={y}
                  x2="605"
                  y2={y}
                  stroke="currentColor"
                  className="text-slate-200 dark:text-slate-700"
                  strokeDasharray="3 4"
                />
              ))}
              <path
                d="M48 170 L135 132 L222 158 L309 124 L396 144 L483 92 L560 109 L603 92 L603 218 L48 218 Z"
                fill="url(#revenue-fill)"
              />
              <polyline
                points="48,170 135,132 222,158 309,124 396,144 483,92 560,109 603,92"
                fill="none"
                stroke="#0969f9"
                strokeWidth="3"
              />
              {[
                "48,170",
                "135,132",
                "222,158",
                "309,124",
                "396,144",
                "483,92",
                "560,109",
                "603,92",
              ].map((point) => {
                const [cx, cy] = point.split(",");
                return (
                  <circle
                    key={point}
                    cx={cx}
                    cy={cy}
                    r="4"
                    fill="white"
                    stroke="#0969f9"
                    strokeWidth="2"
                  />
                );
              })}
              <text x="8" y="42" className="fill-slate-500 text-[11px]">
                ₱6K
              </text>
              <text x="8" y="102" className="fill-slate-500 text-[11px]">
                ₱4K
              </text>
              <text x="8" y="162" className="fill-slate-500 text-[11px]">
                ₱2K
              </text>
              <text x="20" y="222" className="fill-slate-500 text-[11px]">
                ₱0
              </text>
              {[
                "May 13",
                "May 14",
                "May 15",
                "May 16",
                "May 17",
                "May 18",
                "May 19",
              ].map((day, index) => (
                <text
                  key={day}
                  x={48 + index * 87}
                  y="246"
                  textAnchor="middle"
                  className="fill-slate-500 text-[11px]"
                >
                  {day}
                </text>
              ))}
            </svg>
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <article className={`${panelClass} overflow-hidden`}>
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
            <h2 className="text-base font-semibold">Recent Entries</h2>
            <span className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium dark:border-slate-700">
              View all
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[590px] text-left text-xs">
              <thead className="bg-slate-50/70 text-slate-500 dark:bg-slate-900/50 dark:text-slate-400">
                <tr>
                  {[
                    "Time",
                    "License Plate",
                    "Vehicle",
                    "Entry Gate",
                    "Level",
                    "Duration",
                    "Status",
                  ].map((heading) => (
                    <th
                      key={heading}
                      scope="col"
                      className="px-4 py-3 font-medium"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {entries.map((entry) => (
                  <tr key={entry[1]}>
                    {entry.map((cell, index) => (
                      <td
                        key={`${entry[1]}-${index}`}
                        className="whitespace-nowrap px-4 py-3"
                      >
                        {index === 1 ? (
                          <span className="rounded border border-blue-200 px-2 py-1 font-mono font-medium dark:border-blue-800">
                            {cell}
                          </span>
                        ) : index === 6 ? (
                          <span
                            className={`rounded-full px-2 py-1 font-medium ${cell === "Active" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"}`}
                          >
                            {cell}
                          </span>
                        ) : (
                          cell
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className={`${panelClass} p-5`}>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Space Map</h2>
            <span className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium dark:border-slate-700">
              Level 2⌄
            </span>
          </div>
          <div
            className="mt-5 grid grid-cols-10 gap-2"
            aria-label="Parking space status preview"
          >
            {parkingSpaces.map((status, index) => (
              <span
                key={`${status}-${index}`}
                title={`${String.fromCharCode(65 + Math.floor(index / 10))}${(index % 10) + 1}: ${status}`}
                className={`aspect-[1.35] rounded-sm border ${mapTone[status]}`}
              >
                <span className="sr-only">{status}</span>
              </span>
            ))}
          </div>
          <div className="mt-7 flex flex-wrap justify-center gap-x-5 gap-y-2 text-[11px]">
            {(
              [
                "available",
                "occupied",
                "reserved",
                "maintenance",
                "accessible",
              ] as const
            ).map((status) => (
              <span key={status} className="flex items-center gap-2 capitalize">
                <span
                  className={`size-3 rounded-sm border ${mapTone[status]}`}
                />
                {status}
              </span>
            ))}
          </div>
        </article>
      </section>

      <footer className="pt-3 text-center text-xs text-slate-400">
        © 2026 E-ParkGO. Preview metrics are illustrative until operational data
        services are connected.
      </footer>
    </div>
  );
}
