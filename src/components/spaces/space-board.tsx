"use client";

import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SpaceBoardRecord, SpaceStatus } from "@/features/spaces/service";
import { cn } from "@/lib/utils";

const statusLabels: Record<SpaceStatus, string> = {
  AVAILABLE: "Available",
  OCCUPIED: "Occupied",
  OUT_OF_SERVICE: "Out of service",
};

const statusStyles: Record<SpaceStatus, string> = {
  AVAILABLE:
    "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200",
  OCCUPIED:
    "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200",
  OUT_OF_SERVICE:
    "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300",
};

interface SpaceBoardProps {
  spaces: SpaceBoardRecord[];
  zones: { id: string; code: string; name: string }[];
  isAdmin: boolean;
  onToggleStatus?: (space: SpaceBoardRecord) => void;
}

export function SpaceBoard({
  spaces,
  zones,
  isAdmin,
  onToggleStatus,
}: SpaceBoardProps) {
  const [zoneFilter, setZoneFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredSpaces = useMemo(() => {
    return spaces.filter((space) => {
      const zoneMatch = zoneFilter === "all" || space.zone_id === zoneFilter;
      const statusMatch =
        statusFilter === "all" || space.status === statusFilter;
      return zoneMatch && statusMatch;
    });
  }, [spaces, statusFilter, zoneFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="min-w-[180px]">
          <label className="mb-1 block text-sm font-medium" htmlFor="zone-filter">
            Zone
          </label>
          <Select value={zoneFilter} onValueChange={(value) => setZoneFilter(value ?? 'all')}>
            <SelectTrigger id="zone-filter" className="w-full">
              <SelectValue placeholder="All zones" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All zones</SelectItem>
              {zones.map((zone) => (
                <SelectItem key={zone.id} value={zone.id}>
                  {zone.code} — {zone.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-[180px]">
          <label
            className="mb-1 block text-sm font-medium"
            htmlFor="status-filter"
          >
            Status
          </label>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value ?? 'all')}>
            <SelectTrigger id="status-filter" className="w-full">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="AVAILABLE">Available</SelectItem>
              <SelectItem value="OCCUPIED">Occupied</SelectItem>
              <SelectItem value="OUT_OF_SERVICE">Out of service</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredSpaces.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
          <p className="font-medium">No spaces match these filters</p>
          <p className="mt-1 text-sm text-slate-500">
            Adjust the filters or add spaces from facility settings.
          </p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filteredSpaces.map((space) => (
            <li key={space.id}>
              <article
                className={cn(
                  "flex h-full flex-col rounded-xl border p-4 shadow-xs",
                  statusStyles[space.status],
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-semibold">{space.code}</h3>
                    <p className="text-sm opacity-80">
                      {space.zone_code} · {space.vehicle_type_code ?? "Any type"}
                    </p>
                  </div>
                  <Badge variant="outline">{statusLabels[space.status]}</Badge>
                </div>
                {isAdmin && onToggleStatus && space.status !== "OCCUPIED" ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-4 w-full"
                    onClick={() => onToggleStatus(space)}
                  >
                    {space.status === "OUT_OF_SERVICE"
                      ? "Mark available"
                      : "Mark out of service"}
                  </Button>
                ) : null}
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
