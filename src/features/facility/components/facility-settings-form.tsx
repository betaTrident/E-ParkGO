"use client";

import { useActionState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
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

interface SettingsFormProps {
  settings: FacilitySettingsRecord;
}

export function GeneralSettingsForm({ settings }: SettingsFormProps) {
  const [state, formAction, isPending] = useActionState(
    updateFacilitySettingsAction,
    initialState,
  );

  const graceDisplayMinutes =
    typeof settings.settings.grace_display_minutes === "number"
      ? settings.settings.grace_display_minutes
      : 15;

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
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
            className="font-mono text-xs"
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
            className="font-mono uppercase tracking-wider"
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

      <p className="text-xs text-muted-foreground">
        Currency: <span className="font-semibold text-foreground">{settings.currency}</span>. Operational changes are audited and location-scoped.
      </p>

      {state.error && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {state.message && (
        <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200">
          <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : "Save facility settings"}
      </Button>
    </form>
  );
}

export function CapacitySettingsForm({ settings }: SettingsFormProps) {
  const [capacityState, capacityFormAction, isCapacityPending] = useActionState(
    updateLocationCapacitiesAction,
    initialState,
  );

  return (
    <form action={capacityFormAction} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
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

      <p className="text-xs text-muted-foreground">
        Set maximum concurrent capacity per vehicle pool. New entries are rejected when capacity is reached.
      </p>

      {capacityState.error && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{capacityState.error}</AlertDescription>
        </Alert>
      )}

      {capacityState.message && (
        <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200">
          <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
          <AlertDescription>{capacityState.message}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" disabled={isCapacityPending}>
        {isCapacityPending ? "Saving..." : "Save capacity pools"}
      </Button>
    </form>
  );
}

export function FacilitySettingsForm({ settings }: SettingsFormProps) {
  return (
    <div className="space-y-8">
      <GeneralSettingsForm settings={settings} />
      <CapacitySettingsForm settings={settings} />
    </div>
  );
}
