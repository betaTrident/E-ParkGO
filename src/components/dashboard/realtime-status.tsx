import { RefreshCw, Wifi, WifiOff } from "lucide-react";

import type { RealtimeConnectionState } from "@/features/dashboard/types";
import { Button } from "@/components/ui/button";
import { formatBusinessDateTime } from "@/lib/time/business-time";

interface RealtimeStatusProps {
  state: RealtimeConnectionState;
  lastUpdatedAt?: string;
  onRefresh: () => void;
  isRefreshing?: boolean;
  connectivity?: "online" | "offline" | "degraded";
}

const stateLabels: Record<RealtimeConnectionState, string> = {
  idle: "Starting",
  connecting: "Connecting",
  live: "Live",
  reconnecting: "Reconnecting",
  stale: "Stale",
  offline: "Offline",
};

export function RealtimeStatus({
  state,
  lastUpdatedAt,
  onRefresh,
  isRefreshing = false,
  connectivity = "online",
}: RealtimeStatusProps) {
  const effectiveState = connectivity === "offline" ? "offline" : state;

  const label = stateLabels[effectiveState];
  const timestampLabel = lastUpdatedAt
    ? formatBusinessDateTime(lastUpdatedAt)
    : "Not yet loaded";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900/40">
      <div className="flex items-center gap-2">
        {effectiveState === "offline" ? (
          <WifiOff aria-hidden className="size-4 text-amber-600" />
        ) : (
          <Wifi
            aria-hidden
            className={`size-4 ${effectiveState === "live" ? "text-emerald-600" : "text-amber-600"}`}
          />
        )}
        <span>
          Status: <strong className="font-semibold">{label}</strong>
          {effectiveState === "stale" ? (
            <span className="text-slate-600 dark:text-slate-300">
              {" "}
              since {timestampLabel}
            </span>
          ) : null}
        </span>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Snapshot {timestampLabel}
      </p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onRefresh}
        disabled={isRefreshing || effectiveState === "offline"}
      >
        <RefreshCw
          aria-hidden
          className={`mr-2 size-4 motion-reduce:animate-none ${isRefreshing ? "animate-spin" : ""}`}
        />
        Refresh
      </Button>
    </div>
  );
}
