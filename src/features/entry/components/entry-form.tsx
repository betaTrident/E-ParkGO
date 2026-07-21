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
import type { SpaceBoardRecord } from "@/features/spaces/service";
import type { VehicleTypeRecord } from "@/features/spaces/service";
import { useTicketCredentials } from "@/lib/security/ticket-credential-context";

const initialState: EntryActionState = {
  success: false,
  error: null,
  ticketNumber: null,
  qrPayload: null,
  credentialRecovery: null,
};

interface EntryFormProps {
  spaces: SpaceBoardRecord[];
  vehicleTypes: VehicleTypeRecord[];
}

export function EntryForm({ spaces, vehicleTypes }: EntryFormProps) {
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

  const availableSpaces = useMemo(
    () =>
      spaces.filter(
        (space) =>
          space.status === "AVAILABLE" &&
          (!space.vehicle_type_id || space.vehicle_type_id === vehicleTypeId),
      ),
    [spaces, vehicleTypeId],
  );

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
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="plateNumber">Plate number</Label>
          <Input
            id="plateNumber"
            name="plateNumber"
            autoComplete="off"
            required
            placeholder="ABC-1234"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="vehicleTypeId">Vehicle type</Label>
          <NativeSelect
            id="vehicleTypeId"
            name="vehicleTypeId"
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
        </div>

        <div className="space-y-2">
          <Label htmlFor="color">Color (optional)</Label>
          <Input id="color" name="color" autoComplete="off" />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="parkingSpaceId">Parking space</Label>
          <NativeSelect id="parkingSpaceId" name="parkingSpaceId" required>
            <NativeSelectOption value="">Select an available space</NativeSelectOption>
            {availableSpaces.map((space) => (
              <NativeSelectOption key={space.id} value={space.id}>
                {space.zone_code}-{space.code}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {availableSpaces.length} compatible spaces available.
          </p>
        </div>
      </div>

      {state.error ? (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending || availableSpaces.length === 0}>
        {pending ? "Creating entry..." : "Create entry and issue ticket"}
      </Button>
    </form>
  );
}
