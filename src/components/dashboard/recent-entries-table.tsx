"use client";

import { ArrowDown, ArrowRight, Car } from "lucide-react";
import Link from "next/link";
import type { DashboardSnapshot } from "@/features/dashboard/types";
import { formatBusinessDateTime } from "@/lib/time/business-time";

interface RecentEntriesTableProps {
  snapshot?: DashboardSnapshot | null;
}

const mockEntries = [
  {
    id: "1",
    time: "10:24 AM",
    plate: "ABC-1234",
    vehicle: "Toyota RAV4",
    gate: "Gate A",
    level: "Level 2",
    duration: "01h 15m",
    status: "Active",
  },
  {
    id: "2",
    time: "10:21 AM",
    plate: "XYZ-9876",
    vehicle: "Honda CR-V",
    gate: "Gate B",
    level: "Level 1",
    duration: "00h 42m",
    status: "Active",
  },
  {
    id: "3",
    time: "10:18 AM",
    plate: "LMN-4567",
    vehicle: "Tesla Model 3",
    gate: "Gate A",
    level: "Level 3",
    duration: "01h 02m",
    status: "Active",
  },
  {
    id: "4",
    time: "10:15 AM",
    plate: "DEF-2345",
    vehicle: "Ford Escape",
    gate: "Gate C",
    level: "Level 2",
    duration: "00h 30m",
    status: "Reserved",
  },
  {
    id: "5",
    time: "10:12 AM",
    plate: "GHI-7890",
    vehicle: "Chevrolet Malibu",
    gate: "Gate B",
    level: "Level 1",
    duration: "00h 50m",
    status: "Active",
  },
];

export function RecentEntriesTable({ snapshot }: RecentEntriesTableProps) {
  // Use real movements if available or fallback mock items matching reference image
  const movements = snapshot?.recent_movements;
  const entriesList = movements && movements.length > 0
    ? movements.map((m, idx) => ({
        id: m.session_id + idx,
        time: formatBusinessDateTime(m.occurred_at, "h:mm a"),
        plate: m.plate_display,
        vehicle: `Vehicle (${m.kind})`,
        gate: `Gate ${m.zone_code.charAt(0)}`,
        level: `Level ${m.zone_code}`,
        duration: "00h 15m",
        status: m.session_status === "COMPLETED" ? "Completed" : "Active",
      }))
    : mockEntries;

  return (
    <section
      aria-label="Recent Entries"
      className="flex flex-col justify-between rounded-md border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
          Recent Entries
        </h2>
        <Link
          href="/entry"
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          View all
        </Link>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 dark:border-slate-800 dark:text-slate-500">
              <th scope="col" className="pb-3 font-semibold">Time</th>
              <th scope="col" className="pb-3 font-semibold">License Plate</th>
              <th scope="col" className="pb-3 font-semibold">Vehicle</th>
              <th scope="col" className="pb-3 font-semibold">Entry Gate</th>
              <th scope="col" className="pb-3 font-semibold">Level</th>
              <th scope="col" className="pb-3 font-semibold">Duration</th>
              <th scope="col" className="pb-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {entriesList.slice(0, 5).map((row) => (
              <tr key={row.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                <td className="whitespace-nowrap py-3 font-medium text-slate-600 dark:text-slate-300">
                  {row.time}
                </td>
                <td className="whitespace-nowrap py-3">
                  <span className="inline-block rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-[11px] font-semibold tracking-wider text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {row.plate}
                  </span>
                </td>
                <td className="whitespace-nowrap py-3 font-medium text-slate-700 dark:text-slate-200">
                  <div className="flex items-center gap-1.5">
                    <Car className="size-3.5 text-slate-400" />
                    <span>{row.vehicle}</span>
                  </div>
                </td>
                <td className="whitespace-nowrap py-3 font-medium text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <ArrowDown className="size-3" />
                    <span className="text-slate-700 dark:text-slate-300">{row.gate}</span>
                  </div>
                </td>
                <td className="whitespace-nowrap py-3 text-slate-600 dark:text-slate-400">
                  {row.level}
                </td>
                <td className="whitespace-nowrap py-3 text-slate-600 dark:text-slate-400">
                  {row.duration}
                </td>
                <td className="whitespace-nowrap py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      row.status === "Active"
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                        : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
                    }`}
                  >
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Link */}
      <div className="mt-4 flex items-center justify-center border-t border-slate-100 pt-3 dark:border-slate-800">
        <Link
          href="/entry"
          className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          <span>View all entries</span>
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </section>
  );
}
