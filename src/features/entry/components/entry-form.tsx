"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CarFront, CheckCircle2 } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createEntryAction,
  type EntryActionState,
} from "@/features/entry/actions";
import type { VehicleTypeRecord } from "@/features/spaces/service";
import { useTicketCredentials } from "@/lib/security/ticket-credential-context";
import { cn } from "@/lib/utils";

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
      <input type="hidden" name="vehicleTypeId" value={vehicleTypeId} />

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="plateNumber">Plate number</Label>
          <Input
            id="plateNumber"
            name="plateNumber"
            autoComplete="off"
            autoFocus
            required
            placeholder="ABC-1234"
            className="font-mono uppercase tracking-wider"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="vehicleTypeId">Vehicle type</Label>
            <span
              className={cn(
                "chip",
                remaining > 0 ? "chip-active" : "chip-pending",
              )}
            >
              {remaining} of {pool.capacity} free
            </span>
          </div>

          <Select value={vehicleTypeId} onValueChange={(val) => val && setVehicleTypeId(val)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select vehicle type" />
            </SelectTrigger>
            <SelectContent>
              {vehicleTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.name} ({type.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <p className="text-xs text-muted-foreground">
            {pool.occupied} occupied in {poolKey === "car" ? "car" : "motorcycle"} pool.
          </p>
        </div>
      </div>

      {remaining <= 0 && (
        <Alert className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
          <AlertCircle className="size-4 text-amber-600 dark:text-amber-400" />
          <AlertDescription>
            This vehicle type pool is at capacity. Choose a different type or wait for a vehicle to exit.
          </AlertDescription>
        </Alert>
      )}

      {state.error && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={pending || remaining <= 0}
      >
        <CarFront className="mr-2 size-4" />
        {pending ? "Creating entry..." : "Create entry and issue ticket"}
      </Button>
    </form>
  );
}
