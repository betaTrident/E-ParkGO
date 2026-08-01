"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  updateFacilitySettingsAction,
  updateLocationCapacitiesAction,
  type FacilityActionState,
} from "@/features/facility/actions";
import type { FacilitySettingsRecord } from "@/features/facility/service";

const initialState: FacilityActionState = {
  success: false,
  error: null,
  message: null,
};

interface FacilitySettingsFormProps {
  settings: FacilitySettingsRecord;
}

export function FacilitySettingsForm({ settings }: FacilitySettingsFormProps) {
  const [state, formAction, isPending] = useActionState(
    updateFacilitySettingsAction,
    initialState,
  );
  const [capacityState, capacityFormAction, isCapacityPending] = useActionState(
    updateLocationCapacitiesAction,
    initialState,
  );

  const graceDisplayMinutes =
    typeof settings.settings.grace_display_minutes === "number"
      ? settings.settings.grace_display_minutes
      : 15;

  return (
    <div className="space-y-10">
      <form action={formAction} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Facility name</Label>
            <Input
              id="name"
              name="name"
              defaultValue={settings.name}
              required
              autoComplete="organization"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Input
              id="timezone"
              name="timezone"
              defaultValue={settings.timezone}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="receiptPrefix">Receipt prefix</Label>
            <Input
              id="receiptPrefix"
              name="receiptPrefix"
              defaultValue={settings.receipt_prefix}
              required
              className="uppercase"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="graceDisplayMinutes">Grace display (minutes)</Label>
            <Input
              id="graceDisplayMinutes"
              name="graceDisplayMinutes"
              type="number"
              min={0}
              max={180}
              defaultValue={graceDisplayMinutes}
              required
            />
          </div>
        </div>

        <p className="text-sm text-slate-500 dark:text-slate-400">
          Currency: {settings.currency}. Operational changes are audited and
          location-scoped.
        </p>

        {state.error ? (
          <p role="alert" className="text-sm font-medium text-red-600">
            {state.error}
          </p>
        ) : null}
        {state.message ? (
          <p role="status" className="text-sm font-medium text-emerald-600">
            {state.message}
          </p>
        ) : null}

        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save facility settings"}
        </Button>
      </form>

      <form action={capacityFormAction} className="space-y-6 border-t border-slate-200 pt-8 dark:border-slate-800">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            Capacity pools
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Set how many cars and motorcycles can be parked at once. Entry is
            rejected when a pool is full.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="carCapacity">Car capacity</Label>
            <Input
              id="carCapacity"
              name="carCapacity"
              type="number"
              min={0}
              defaultValue={settings.car_capacity}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="motorcycleCapacity">Motorcycle capacity</Label>
            <Input
              id="motorcycleCapacity"
              name="motorcycleCapacity"
              type="number"
              min={0}
              defaultValue={settings.motorcycle_capacity}
              required
            />
          </div>
        </div>

        {capacityState.error ? (
          <p role="alert" className="text-sm font-medium text-red-600">
            {capacityState.error}
          </p>
        ) : null}
        {capacityState.message ? (
          <p role="status" className="text-sm font-medium text-emerald-600">
            {capacityState.message}
          </p>
        ) : null}

        <Button type="submit" disabled={isCapacityPending}>
          {isCapacityPending ? "Saving..." : "Save capacity pools"}
        </Button>
      </form>
    </div>
  );
}
