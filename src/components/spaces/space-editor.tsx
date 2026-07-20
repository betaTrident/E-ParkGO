"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  createSpaceAction,
  createVehicleTypeAction,
  createZoneAction,
  type SpaceActionState,
} from "@/features/spaces/actions";
import type { VehicleTypeRecord, ZoneRecord } from "@/features/spaces/service";

const initialState: SpaceActionState = {
  success: false,
  error: null,
  message: null,
};

interface SpaceEditorProps {
  zones: ZoneRecord[];
  vehicleTypes: VehicleTypeRecord[];
}

export function SpaceEditor({ zones, vehicleTypes }: SpaceEditorProps) {
  const [zoneOpen, setZoneOpen] = useState(false);
  const [vehicleOpen, setVehicleOpen] = useState(false);
  const [spaceOpen, setSpaceOpen] = useState(false);
  const [zoneState, zoneAction, zonePending] = useActionState(
    createZoneAction,
    initialState,
  );
  const [vehicleState, vehicleAction, vehiclePending] = useActionState(
    createVehicleTypeAction,
    initialState,
  );
  const [spaceState, spaceAction, spacePending] = useActionState(
    createSpaceAction,
    initialState,
  );

  if (zoneState.success && zoneOpen) setZoneOpen(false);
  if (vehicleState.success && vehicleOpen) setVehicleOpen(false);
  if (spaceState.success && spaceOpen) setSpaceOpen(false);

  return (
    <div className="flex flex-wrap gap-3">
      <Dialog open={zoneOpen} onOpenChange={setZoneOpen}>
        <DialogTrigger render={<Button variant="outline">Add zone</Button>} />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add parking zone</DialogTitle>
            <DialogDescription>
              Zone codes must be unique within this facility.
            </DialogDescription>
          </DialogHeader>
          <form action={zoneAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="zone-code">Code</Label>
              <Input id="zone-code" name="code" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zone-name">Name</Label>
              <Input id="zone-name" name="name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zone-sort">Sort order</Label>
              <Input
                id="zone-sort"
                name="sortOrder"
                type="number"
                min={0}
                defaultValue={zones.length + 1}
                required
              />
            </div>
            {zoneState.error ? (
              <p role="alert" className="text-sm text-red-600">
                {zoneState.error}
              </p>
            ) : null}
            <DialogFooter>
              <Button type="submit" disabled={zonePending}>
                {zonePending ? "Saving..." : "Create zone"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={vehicleOpen} onOpenChange={setVehicleOpen}>
        <DialogTrigger
          render={<Button variant="outline">Add vehicle type</Button>}
        />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add vehicle type</DialogTitle>
          </DialogHeader>
          <form action={vehicleAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="vehicle-code">Code</Label>
              <Input id="vehicle-code" name="code" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicle-name">Name</Label>
              <Input id="vehicle-name" name="name" required />
            </div>
            {vehicleState.error ? (
              <p role="alert" className="text-sm text-red-600">
                {vehicleState.error}
              </p>
            ) : null}
            <DialogFooter>
              <Button type="submit" disabled={vehiclePending}>
                {vehiclePending ? "Saving..." : "Create vehicle type"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={spaceOpen} onOpenChange={setSpaceOpen}>
        <DialogTrigger render={<Button>Add space</Button>} />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add parking space</DialogTitle>
          </DialogHeader>
          <form action={spaceAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="space-zone">Zone</Label>
              <NativeSelect
                id="space-zone"
                name="zoneId"
                className="w-full"
                required
                defaultValue=""
              >
                <NativeSelectOption value="" disabled>
                  Select zone
                </NativeSelectOption>
                {zones
                  .filter((zone) => zone.is_active)
                  .map((zone) => (
                    <NativeSelectOption key={zone.id} value={zone.id}>
                      {zone.code} — {zone.name}
                    </NativeSelectOption>
                  ))}
              </NativeSelect>
            </div>
            <div className="space-y-2">
              <Label htmlFor="space-code">Space code</Label>
              <Input id="space-code" name="code" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="space-vehicle">Vehicle type</Label>
              <NativeSelect
                id="space-vehicle"
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
            {spaceState.error ? (
              <p role="alert" className="text-sm text-red-600">
                {spaceState.error}
              </p>
            ) : null}
            <DialogFooter>
              <Button type="submit" disabled={spacePending}>
                {spacePending ? "Saving..." : "Create space"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
