"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  createRateDraftAction,
  publishRateAction,
  type RateActionState,
} from "@/features/rates/actions";
import type { VehicleTypeRecord } from "@/features/spaces/service";
import { formatCentavosPhp } from "@/lib/money/centavos";

const initialState: RateActionState = {
  success: false,
  error: null,
  message: null,
};

interface RateEditorProps {
  vehicleTypes: VehicleTypeRecord[];
}

export function RateEditor({ vehicleTypes }: RateEditorProps) {
  const [draftState, draftAction, draftPending] = useActionState(
    createRateDraftAction,
    initialState,
  );
  const [publishState, publishAction, publishPending] = useActionState(
    publishRateAction,
    initialState,
  );

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
        <h2 className="text-lg font-semibold">Create rate draft</h2>
        <p className="mt-1 text-sm text-slate-500">
          Drafts stay editable until published. Amounts are integer centavos on
          the wire (example: 5000 = {formatCentavosPhp("5000")}).
        </p>
        <form action={draftAction} className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="vehicleTypeId">Vehicle type</Label>
            <NativeSelect
              id="vehicleTypeId"
              name="vehicleTypeId"
              className="w-full"
              required
              defaultValue=""
            >
              <NativeSelectOption value="" disabled>
                Select vehicle type
              </NativeSelectOption>
              {vehicleTypes
                .filter((type) => type.is_active)
                .map((type) => (
                  <NativeSelectOption key={type.id} value={type.id}>
                    {type.code} — {type.name}
                  </NativeSelectOption>
                ))}
            </NativeSelect>
          </div>
          <div className="space-y-2">
            <Label htmlFor="mode">Mode</Label>
            <NativeSelect
              id="mode"
              name="mode"
              className="w-full"
              defaultValue="TIERED"
              required
            >
              <NativeSelectOption value="TIERED">Tiered</NativeSelectOption>
              <NativeSelectOption value="FLAT">Flat</NativeSelectOption>
            </NativeSelect>
          </div>
          <div className="space-y-2">
            <Label htmlFor="graceMinutes">Grace minutes</Label>
            <Input
              id="graceMinutes"
              name="graceMinutes"
              type="number"
              min={0}
              defaultValue={15}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="effectiveFrom">Effective from (ISO)</Label>
            <Input
              id="effectiveFrom"
              name="effectiveFrom"
              defaultValue="2026-08-01T00:00:00+08:00"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="initialMinutes">Initial minutes (tiered)</Label>
            <Input id="initialMinutes" name="initialMinutes" type="number" min={1} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="initialFeeCentavos">Initial fee centavos</Label>
            <Input id="initialFeeCentavos" name="initialFeeCentavos" inputMode="numeric" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="succeedingIntervalMinutes">Succeeding interval minutes</Label>
            <Input
              id="succeedingIntervalMinutes"
              name="succeedingIntervalMinutes"
              type="number"
              min={1}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="succeedingFeeCentavos">Succeeding fee centavos</Label>
            <Input
              id="succeedingFeeCentavos"
              name="succeedingFeeCentavos"
              inputMode="numeric"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="flatFeeCentavos">Flat fee centavos</Label>
            <Input id="flatFeeCentavos" name="flatFeeCentavos" inputMode="numeric" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dailyMaxCentavos">Daily max centavos</Label>
            <Input id="dailyMaxCentavos" name="dailyMaxCentavos" inputMode="numeric" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="overnightFeeCentavos">Overnight fee centavos</Label>
            <Input
              id="overnightFeeCentavos"
              name="overnightFeeCentavos"
              defaultValue="5000"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lostTicketPenaltyCentavos">Lost ticket penalty centavos</Label>
            <Input
              id="lostTicketPenaltyCentavos"
              name="lostTicketPenaltyCentavos"
              defaultValue="20000"
              required
            />
          </div>
          {draftState.error ? (
            <p role="alert" className="text-sm text-red-600 md:col-span-2">
              {draftState.error}
            </p>
          ) : null}
          {draftState.message ? (
            <p role="status" className="text-sm text-emerald-600 md:col-span-2">
              {draftState.message}
            </p>
          ) : null}
          <div className="md:col-span-2">
            <Button type="submit" disabled={draftPending}>
              {draftPending ? "Saving draft..." : "Save draft"}
            </Button>
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
        <h2 className="text-lg font-semibold">Publish draft</h2>
        <form action={publishAction} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <div className="grow space-y-2">
            <Label htmlFor="publish-rate-id">Draft rate ID</Label>
            <Input
              id="publish-rate-id"
              name="rateId"
              placeholder="Paste draft UUID from the list below"
              required
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={publishPending}>
              {publishPending ? "Publishing..." : "Publish rate"}
            </Button>
          </div>
        </form>
        {publishState.error ? (
          <p role="alert" className="mt-3 text-sm text-red-600">
            {publishState.error}
          </p>
        ) : null}
        {publishState.message ? (
          <p role="status" className="mt-3 text-sm text-emerald-600">
            {publishState.message}
          </p>
        ) : null}
      </section>
    </div>
  );
}
