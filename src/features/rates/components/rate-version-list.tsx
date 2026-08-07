"use client";

import { useActionState, useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DataTable,
  type DataTableColumnDef,
} from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import {
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

export function RateVersionList({ rates }: RateVersionListProps) {
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
      },
      {
        accessorKey: "version",
        header: "Version",
        cell: ({ row }) => `v${row.original.version}`,
      },
      {
        accessorKey: "mode",
        header: "Mode",
      },
      {
        id: "summary",
        header: "Summary",
        cell: ({ row }) => {
          const rate = row.original;
          return (
            <div className="max-w-xs text-sm whitespace-normal">
              {rate.mode === "FLAT"
                ? formatCentavosPhp(rate.flat_fee_centavos ?? "0")
                : `${formatCentavosPhp(rate.initial_fee_centavos ?? "0")} + ${formatCentavosPhp(rate.succeeding_fee_centavos ?? "0")}/interval`}
              <span className="mt-1 block text-xs text-slate-500">
                Lost ticket penalty:{" "}
                {formatCentavosPhp(rate.lost_ticket_penalty_centavos ?? "0")}
              </span>
            </div>
          );
        },
      },
      {
        id: "window",
        header: "Effective window",
        cell: ({ row }) => (
          <span className="text-sm whitespace-normal">
            {formatWindow(row.original)}
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={row.original.is_published ? "secondary" : "outline"}>
            {row.original.is_published ? "Published" : "Draft"}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const rate = row.original;
          return (
            <div className="flex flex-col items-end gap-2">
              <code className="text-xs text-slate-500">{rate.id}</code>
              {!rate.is_published ? (
                <form action={withdrawAction}>
                  <input type="hidden" name="rateId" value={rate.id} />
                  <Button
                    type="submit"
                    size="sm"
                    variant="outline"
                    disabled={withdrawPending}
                  >
                    Withdraw
                  </Button>
                </form>
              ) : rate.effective_to ? null : (
                <form action={retireAction} className="flex items-center gap-2">
                  <input type="hidden" name="rateId" value={rate.id} />
                  <Input
                    name="effectiveTo"
                    defaultValue="2026-12-31T23:59:59+08:00"
                    className="h-8 w-52 text-xs"
                    aria-label={`Retire effective to for ${rate.id}`}
                  />
                  <Button
                    type="submit"
                    size="sm"
                    variant="outline"
                    disabled={retirePending}
                  >
                    Retire
                  </Button>
                </form>
              )}
            </div>
          );
        },
      },
    ],
    [retireAction, retirePending, withdrawAction, withdrawPending],
  );

  if (rates.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
        <p className="font-medium">No rate versions yet</p>
        <p className="mt-1 text-sm text-slate-500">
          Create a draft using the PLAN §17 tiered fixture values to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <DataTable
        className="rounded-xl border-slate-200 dark:border-slate-800"
        columns={columns}
        data={rates}
        getRowId={(row) => row.id}
      />
      {retireState.error || withdrawState.error ? (
        <p role="alert" className="text-sm text-red-600">
          {retireState.error ?? withdrawState.error}
        </p>
      ) : null}
      {retireState.message || withdrawState.message ? (
        <p role="status" className="text-sm text-emerald-600">
          {retireState.message ?? withdrawState.message}
        </p>
      ) : null}
    </div>
  );
}
