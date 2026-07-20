"use client";

import { useActionState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vehicle</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Mode</TableHead>
              <TableHead>Summary</TableHead>
              <TableHead>Effective window</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rates.map((rate) => (
              <TableRow key={rate.id}>
                <TableCell>{rate.vehicle_type_code ?? "All types"}</TableCell>
                <TableCell>v{rate.version}</TableCell>
                <TableCell>{rate.mode}</TableCell>
                <TableCell className="max-w-xs text-sm">
                  {rate.mode === "FLAT"
                    ? formatCentavosPhp(rate.flat_fee_centavos ?? "0")
                    : `${formatCentavosPhp(rate.initial_fee_centavos ?? "0")} + ${formatCentavosPhp(rate.succeeding_fee_centavos ?? "0")}/interval`}
                </TableCell>
                <TableCell className="text-sm">{formatWindow(rate)}</TableCell>
                <TableCell>
                  <Badge variant={rate.is_published ? "secondary" : "outline"}>
                    {rate.is_published ? "Published" : "Draft"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
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
