"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  createEntryAction,
  type EntryActionState,
} from "@/features/entry/actions";
import type { VehicleTypeRecord } from "@/features/spaces/service";
import { useTicketCredentials } from "@/lib/security/ticket-credential-context";

const initialState: EntryActionState = {
  success: false,
  error: null,
  ticketNumber: null,
  qrPayload: null,
  credentialRecovery: null,
};

export interface PoolCapacities {
  car: { capacity: number; occupied: number };
  motorcycle: { capacity: number; occupied: number };
}

interface EntryFormProps {
  vehicleTypes: VehicleTypeRecord[];
  poolCapacities: PoolCapacities;
  poolRemaining: Record<string, number>;
}

function resolvePoolKey(code: string): keyof PoolCapacities {
  return code === "MOTO" ? "motorcycle" : "car";
}

export function EntryForm({
  vehicleTypes,
  poolCapacities,
  poolRemaining,
}: EntryFormProps) {
  const router = useRouter();
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const { storeTicketCredential } = useTicketCredentials();
  const [vehicleTypeId, setVehicleTypeId] = useState(
    vehicleTypes[0]?.id ?? "",
  );
  const [state, formAction, pending] = useActionState(
    createEntryAction,
    initialState,
  );

  const selectedType = useMemo(
    () => vehicleTypes.find((type) => type.id === vehicleTypeId),
    [vehicleTypeId, vehicleTypes],
  );

  const remaining = poolRemaining[vehicleTypeId] ?? 0;
  const poolKey = selectedType ? resolvePoolKey(selectedType.code) : "car";
  const pool = poolCapacities[poolKey];

  useEffect(() => {
    if (state.success && state.ticketNumber) {
      if (state.qrPayload) {
        storeTicketCredential(state.ticketNumber, state.qrPayload);
      }

      const params = new URLSearchParams();
      if (state.qrPayload) {
        params.set("issued", "1");
      } else if (state.credentialRecovery) {
        params.set("recovery", state.credentialRecovery);
      }

      router.push(`/tickets/${state.ticketNumber}?${params.toString()}`);
    }
  }, [router, state, storeTicketCredential]);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="plateNumber">Plate number</Label>
          <Input
            id="plateNumber"
            name="plateNumber"
            autoComplete="off"
            autoFocus
            required
            placeholder="ABC-1234"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="vehicleTypeId">Vehicle type</Label>
          <NativeSelect
            id="vehicleTypeId"
            name="vehicleTypeId"
            className="w-full"
            value={vehicleTypeId}
            onChange={(event) => setVehicleTypeId(event.target.value)}
            required
          >
            {vehicleTypes.map((type) => (
              <NativeSelectOption key={type.id} value={type.id}>
                {type.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {remaining} of {pool.capacity} {poolKey === "car" ? "car" : "motorcycle"}{" "}
            spaces free ({pool.occupied} occupied).
          </p>
        </div>
      </div>

      {remaining <= 0 ? (
        <p
          role="status"
          className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
        >
          No free parking spaces left for this vehicle type. Choose a different
          type or wait for a session to exit.
        </p>
      ) : null}

      {state.error ? (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
        >
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending || remaining <= 0}>
        {pending ? "Creating entry..." : "Create entry and issue ticket"}
      </Button>
    </form>
  );
}
