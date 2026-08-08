"use client";

import { useActionState, useMemo, useState } from "react";
import { Check, Copy, SlidersHorizontal } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  DataTable,
  type DataTableColumnDef,
} from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusChip } from "@/components/shared/status-chip";
import {
  publishRateAction,
  retireRateAction,
  withdrawRateDraftAction,
  type RateActionState,
} from "@/features/rates/actions";
import type { RateVersionRecord } from "@/features/rates/service";
import { formatCentavosPhp } from "@/lib/money/centavos";

const initialState: RateActionState = {
  success: false,
  error: null,
  message: null,
};

interface RateVersionListProps {
  rates: RateVersionRecord[];
}

function formatWindow(rate: RateVersionRecord): string {
  const end = rate.effective_to
    ? new Date(rate.effective_to).toLocaleString()
    : "Open-ended";
  return `${new Date(rate.effective_from).toLocaleString()} → ${end}`;
}

function CopyableId({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    void navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={copy}
      title="Copy rate UUID"
      className="inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground hover:text-foreground transition-colors"
    >
      <span>{id.slice(0, 8)}...</span>
      {copied ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
    </button>
  );
}

export function RateVersionList({ rates }: RateVersionListProps) {
  const [publishState, publishAction, publishPending] = useActionState(
    publishRateAction,
    initialState,
  );
  const [retireState, retireAction, retirePending] = useActionState(
    retireRateAction,
    initialState,
  );
  const [withdrawState, withdrawAction, withdrawPending] = useActionState(
    withdrawRateDraftAction,
    initialState,
  );

  const columns = useMemo<Array<DataTableColumnDef<RateVersionRecord>>>(
    () => [
      {
        id: "vehicle",
        header: "Vehicle",
        accessorFn: (row) => row.vehicle_type_code ?? "All types",
        cell: ({ row }) => (
          <span className="ref-tag">{row.original.vehicle_type_code ?? "ALL"}</span>
        ),
      },
      {
        accessorKey: "version",
        header: "Ver.",
        cell: ({ row }) => (
          <span className="font-mono text-xs font-semibold">v{row.original.version}</span>
        ),
      },
      {
        accessorKey: "mode",
        header: "Mode",
        cell: ({ row }) => (
          <span className="text-xs font-medium text-foreground">{row.original.mode}</span>
        ),
      },
      {
        id: "summary",
        header: "Summary",
        cell: ({ row }) => {
          const rate = row.original;
          return (
            <div className="max-w-xs text-xs whitespace-normal space-y-0.5">
              <p className="font-medium text-foreground">
                {rate.mode === "FLAT"
                  ? formatCentavosPhp(rate.flat_fee_centavos ?? "0")
                  : `${formatCentavosPhp(rate.initial_fee_centavos ?? "0")} + ${formatCentavosPhp(rate.succeeding_fee_centavos ?? "0")}/interval`}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Penalty: {formatCentavosPhp(rate.lost_ticket_penalty_centavos ?? "0")}
              </p>
            </div>
          );
        },
      },
      {
        id: "window",
        header: "Effective Window",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground whitespace-normal">
            {formatWindow(row.original)}
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => (
          <StatusChip status={row.original.is_published ? "PUBLISHED" : "DRAFT"} />
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const rate = row.original;
          return (
            <div className="flex items-center justify-end gap-2">
              <CopyableId id={rate.id} />

              {!rate.is_published ? (
                <div className="flex items-center gap-1.5">
                  <form action={publishAction}>
                    <input type="hidden" name="rateId" value={rate.id} />
                    <Button type="submit" size="sm" disabled={publishPending}>
                      {publishPending ? "Publishing..." : "Publish"}
                    </Button>
                  </form>

                  <form action={withdrawAction}>
                    <input type="hidden" name="rateId" value={rate.id} />
                    <Button type="submit" size="sm" variant="ghost" disabled={withdrawPending}>
                      Withdraw
                    </Button>
                  </form>
                </div>
              ) : rate.effective_to ? null : (
                <Popover>
                  <PopoverTrigger
                    render={
                      <Button size="sm" variant="outline" disabled={retirePending}>
                        Retire
                      </Button>
                    }
                  />
                  <PopoverContent align="end" className="w-80 p-4 space-y-3">
                    <PopoverHeader className="p-0">
                      <PopoverTitle className="text-sm">Retire published rate</PopoverTitle>
                      <PopoverDescription className="text-xs">
                        Set end timestamp for version v{rate.version}.
                      </PopoverDescription>
                    </PopoverHeader>
                    <form action={retireAction} className="space-y-3">
                      <input type="hidden" name="rateId" value={rate.id} />
                      <div className="space-y-1">
                        <Label htmlFor={`effectiveTo-${rate.id}`} className="text-xs">
                          Effective to (ISO)
                        </Label>
                        <Input
                          id={`effectiveTo-${rate.id}`}
                          name="effectiveTo"
                          defaultValue="2026-12-31T23:59:59+08:00"
                          className="h-8 font-mono text-xs"
                          required
                        />
                      </div>
                      <Button type="submit" size="sm" className="w-full" disabled={retirePending}>
                        {retirePending ? "Retiring..." : "Confirm retire"}
                      </Button>
                    </form>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          );
        },
      },
    ],
    [publishAction, publishPending, retireAction, retirePending, withdrawAction, withdrawPending],
  );

  if (rates.length === 0) {
    return (
      <EmptyState
        icon={SlidersHorizontal}
        title="No rate versions yet"
        description="Create a draft rate version to establish parking tariffs."
      />
    );
  }

  const activeError = publishState.error || retireState.error || withdrawState.error;
  const activeMessage = publishState.message || retireState.message || withdrawState.message;

  return (
    <div className="space-y-4">
      <DataTable
        className="border-0 rounded-none"
        columns={columns}
        data={rates}
        getRowId={(row) => row.id}
      />

      {activeError && (
        <Alert variant="destructive">
          <AlertDescription>{activeError}</AlertDescription>
        </Alert>
      )}

      {activeMessage && (
        <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200">
          <AlertDescription>{activeMessage}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
