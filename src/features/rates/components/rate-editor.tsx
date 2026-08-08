"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  createRateDraftAction,
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
  const [open, setOpen] = useState(false);
  const [vehicleTypeId, setVehicleTypeId] = useState("");
  const [mode, setMode] = useState("TIERED");
  const [state, formAction, pending] = useActionState(
    createRateDraftAction,
    initialState,
  );

  if (state.success && open) {
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" className="gap-1.5">
            <Plus className="size-4" />
            New rate draft
          </Button>
        }
      />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Create rate draft</DialogTitle>
          <DialogDescription>
            Drafts stay editable until published. Amounts are in integer centavos on the wire (e.g. 5000 = {formatCentavosPhp("5000")}).
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="vehicleTypeId" value={vehicleTypeId} />
          <input type="hidden" name="mode" value={mode} />

          {/* Group 1: Configuration */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Tariff Configuration
            </h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="vehicleTypeId-select">Vehicle type</Label>
                <Select value={vehicleTypeId} onValueChange={(val) => val && setVehicleTypeId(val)}>
                  <SelectTrigger id="vehicleTypeId-select" className="w-full">
                    <SelectValue placeholder="Select vehicle type" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicleTypes
                      .filter((type) => type.is_active)
                      .map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.code} — {type.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mode-select">Tariff mode</Label>
                <Select value={mode} onValueChange={(val) => val && setMode(val)}>
                  <SelectTrigger id="mode-select" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TIERED">Tiered</SelectItem>
                    <SelectItem value="FLAT">Flat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Group 2: Effective window & Grace */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Timing & Grace
            </h4>
            <div className="grid gap-4 sm:grid-cols-2">
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
                  className="font-mono text-xs"
                  required
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Group 3: Rates & Penalties */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Fee Structures (Centavos)
            </h4>
            {mode === "TIERED" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="initialMinutes">Initial minutes</Label>
                  <Input id="initialMinutes" name="initialMinutes" type="number" min={1} defaultValue={120} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="initialFeeCentavos">Initial fee (centavos)</Label>
                  <Input id="initialFeeCentavos" name="initialFeeCentavos" inputMode="numeric" defaultValue="5000" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="succeedingIntervalMinutes">Succeeding interval (mins)</Label>
                  <Input id="succeedingIntervalMinutes" name="succeedingIntervalMinutes" type="number" min={1} defaultValue={60} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="succeedingFeeCentavos">Succeeding fee (centavos)</Label>
                  <Input id="succeedingFeeCentavos" name="succeedingFeeCentavos" inputMode="numeric" defaultValue="2000" />
                </div>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="flatFeeCentavos">Flat fee (centavos)</Label>
                  <Input id="flatFeeCentavos" name="flatFeeCentavos" inputMode="numeric" defaultValue="5000" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dailyMaxCentavos">Daily max (centavos)</Label>
                  <Input id="dailyMaxCentavos" name="dailyMaxCentavos" inputMode="numeric" />
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 pt-2">
              <div className="space-y-2">
                <Label htmlFor="overnightFeeCentavos">Overnight fee (centavos)</Label>
                <Input id="overnightFeeCentavos" name="overnightFeeCentavos" defaultValue="5000" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lostTicketPenaltyCentavos">Lost ticket penalty (centavos)</Label>
                <Input id="lostTicketPenaltyCentavos" name="lostTicketPenaltyCentavos" defaultValue="20000" required />
              </div>
            </div>
          </div>

          {state.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending || !vehicleTypeId}>
              {pending ? "Saving draft..." : "Save rate draft"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
