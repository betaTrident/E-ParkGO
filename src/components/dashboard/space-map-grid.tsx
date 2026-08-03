"use client";

import { Accessibility, ChevronDown, Info, Maximize2, X } from "lucide-react";

type SlotStatus = "available" | "occupied" | "reserved" | "maintenance" | "accessible";

interface GridCell {
  row: string;
  col: number;
  status: SlotStatus;
}

// Generate 5x10 matrix corresponding to the reference image pattern
const rows = ["A", "B", "C", "D", "E"];
const cols = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const gridData: Record<string, SlotStatus> = {
  "A-1": "accessible",
  "A-2": "available",
  "A-3": "available",
  "A-4": "available",
  "A-5": "available",
  "A-6": "occupied",
  "A-7": "available",
  "A-8": "available",
  "A-9": "available",
  "A-10": "occupied",

  "B-1": "available",
  "B-2": "available",
  "B-3": "available",
  "B-4": "available",
  "B-5": "occupied",
  "B-6": "occupied",
  "B-7": "available",
  "B-8": "available",
  "B-9": "reserved",
  "B-10": "available",

  "C-1": "occupied",
  "C-2": "occupied",
  "C-3": "available",
  "C-4": "available",
  "C-5": "available",
  "C-6": "occupied",
  "C-7": "available",
  "C-8": "available",
  "C-9": "available",
  "C-10": "accessible",

  "D-1": "available",
  "D-2": "available",
  "D-3": "available",
  "D-4": "available",
  "D-5": "available",
  "D-6": "available",
  "D-7": "maintenance",
  "D-8": "available",
  "D-9": "occupied",
  "D-10": "occupied",

  "E-1": "occupied",
  "E-2": "available",
  "E-3": "occupied",
  "E-4": "available",
  "E-5": "available",
  "E-6": "available",
  "E-7": "available",
  "E-8": "available",
  "E-9": "occupied",
  "E-10": "available",
};

export function SpaceMapGrid() {
  return (
    <section
      aria-label="Space Map"
      className="flex flex-col justify-between rounded-md border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
            Space Map
          </h2>
          <Info aria-hidden="true" className="size-4 text-slate-400" />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <span>Level 2</span>
            <ChevronDown className="size-3.5 text-slate-500" />
          </button>
          <button
            type="button"
            aria-label="Expand space map"
            className="flex size-7 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-slate-600 dark:border-slate-700 dark:hover:text-slate-200"
          >
            <Maximize2 className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Grid Header Columns Numbers */}
      <div className="mt-4 overflow-x-auto">
        <div className="min-w-[420px]">
          <div className="mb-2 grid grid-cols-11 text-center text-xs font-semibold text-slate-500">
            <div />
            {cols.map((col) => (
              <div key={col}>{col}</div>
            ))}
          </div>

          {/* Grid Rows A-E */}
          <div className="space-y-2">
            {rows.map((row) => (
              <div key={row} className="grid grid-cols-11 items-center gap-1.5">
                <div className="text-center text-xs font-bold text-slate-700 dark:text-slate-300">
                  {row}
                </div>
                {cols.map((col) => {
                  const key = `${row}-${col}`;
                  const status = gridData[key] || "available";

                  return (
                    <div
                      key={key}
                      className={`flex h-9 items-center justify-center rounded-lg border transition-transform hover:scale-105 ${
                        status === "accessible"
                          ? "border-blue-200 bg-blue-100 text-blue-600 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-400"
                          : status === "available"
                          ? "border-emerald-200 bg-emerald-100/70 dark:border-emerald-900/60 dark:bg-emerald-950/40"
                          : status === "occupied"
                          ? "border-red-200 bg-red-200/80 dark:border-red-900/60 dark:bg-red-950/60"
                          : status === "reserved"
                          ? "border-amber-200 bg-amber-100 dark:border-amber-900/60 dark:bg-amber-950/60"
                          : "border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-500"
                      }`}
                    >
                      {status === "accessible" && (
                        <Accessibility className="size-4" />
                      )}
                      {status === "maintenance" && <X className="size-4" />}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend Footer */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="size-3 rounded bg-emerald-400" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-3 rounded bg-red-400" />
          <span>Occupied</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-3 rounded bg-amber-300" />
          <span>Reserved</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-3 rounded bg-slate-300" />
          <span>Maintenance</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="flex size-3.5 items-center justify-center rounded bg-blue-100 text-blue-600">
            <Accessibility className="size-2.5" />
          </span>
          <span>Accessible</span>
        </div>
      </div>
    </section>
  );
}
