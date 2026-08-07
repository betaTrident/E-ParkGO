"use client";

import { ArrowRight, Car } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import {
  DataTable,
  type DataTableColumnDef,
} from "@/components/ui/data-table";
import type { DashboardSnapshot } from "@/features/dashboard/types";
import { formatBusinessDateTime } from "@/lib/time/business-time";

interface RecentEntriesTableProps {
  snapshot?: DashboardSnapshot | null;
}

type RecentEntryRow = {
  id: string;
  time: string;
  plate: string;
  type: string;
  status: string;
};

const mockEntries: RecentEntryRow[] = [
  {
    id: "1",
    time: "10:24 AM",
    plate: "ABC-1234",
    type: "Car",
    status: "Active",
  },
  {
    id: "2",
    time: "10:21 AM",
    plate: "XYZ-9876",
    type: "Car",
    status: "Active",
  },
  {
    id: "3",
    time: "10:18 AM",
    plate: "LMN-4567",
    type: "Motorcycle",
    status: "Active",
  },
  {
    id: "4",
    time: "10:15 AM",
    plate: "DEF-2345",
    type: "Car",
    status: "Reserved",
  },
  {
    id: "5",
    time: "10:12 AM",
    plate: "GHI-7890",
    type: "Car",
    status: "Active",
  },
];

const columns: Array<DataTableColumnDef<RecentEntryRow>> = [
  {
    accessorKey: "time",
    header: "Time",
    cell: ({ row }) => (
      <span className="font-medium text-slate-600 dark:text-slate-300">
        {row.original.time}
      </span>
    ),
  },
  {
    accessorKey: "plate",
    header: "License Plate",
    cell: ({ row }) => (
      <span className="inline-block rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-[11px] font-semibold tracking-wider text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
        {row.original.plate}
      </span>
    ),
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-200">
        <Car className="size-3.5 text-slate-400" />
        <span>{row.original.type}</span>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <span
        className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
          row.original.status === "Active"
            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
            : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
        }`}
      >
        {row.original.status}
      </span>
    ),
  },
];

export function RecentEntriesTable({ snapshot }: RecentEntriesTableProps) {
  const entriesList = useMemo(() => {
    const movements = snapshot?.recent_movements;
    if (!movements || movements.length === 0) {
      return mockEntries;
    }

    return movements.map((m, idx) => ({
      id: m.session_id + idx,
      time: formatBusinessDateTime(m.occurred_at, "h:mm a"),
      plate: m.plate_display,
      type: m.kind === "entry" ? "Entry" : "Exit",
      status: m.session_status === "COMPLETED" ? "Completed" : "Active",
    }));
  }, [snapshot?.recent_movements]);

  return (
    <section
      aria-label="Recent Entries"
      className="flex flex-col justify-between rounded-md border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
          Recent Entries
        </h2>
        <Link
          href="/sessions"
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          View all
        </Link>
      </div>

      <div className="mt-4">
        <DataTable
          className="border-0"
          columns={columns}
          data={entriesList.slice(0, 5)}
          getRowId={(row) => row.id}
          tableClassName="text-xs"
        />
      </div>

      <div className="mt-4 flex items-center justify-center border-t border-slate-100 pt-3 dark:border-slate-800">
        <Link
          href="/sessions"
          className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          <span>View all sessions</span>
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </section>
  );
}
