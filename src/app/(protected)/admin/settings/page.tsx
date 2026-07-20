import { FacilitySettingsForm } from "@/features/facility/components/facility-settings-form";
import { getFacilitySettings } from "@/features/facility/service";
import { SpaceEditor } from "@/components/spaces/space-editor";
import { listVehicleTypes, listZones } from "@/features/spaces/service";
import { requireAdminProfile } from "@/lib/auth/session";

export default async function AdminSettingsPage() {
  const profile = await requireAdminProfile();
  const [settings, zones, vehicleTypes] = await Promise.all([
    getFacilitySettings(profile.parking_location_id),
    listZones(profile.parking_location_id),
    listVehicleTypes(profile.parking_location_id),
  ]);

  if (!settings) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <p role="alert" className="text-red-600">
          Facility settings could not be loaded for your location.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-8 sm:px-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-blue-600 dark:text-blue-300">
          Administration
        </p>
        <h1 className="text-3xl font-bold tracking-tight">Facility settings</h1>
        <p className="max-w-2xl text-slate-600 dark:text-slate-400">
          Configure facility identity, zones, vehicle types, and space inventory.
          Historical records are deactivated, never deleted.
        </p>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
        <h2 className="text-lg font-semibold">General settings</h2>
        <div className="mt-4">
          <FacilitySettingsForm settings={settings} />
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
        <h2 className="text-lg font-semibold">Zones, types, and spaces</h2>
        <p className="mt-1 text-sm text-slate-500">
          Add inventory using audited configuration RPCs.
        </p>
        <div className="mt-4">
          <SpaceEditor zones={zones} vehicleTypes={vehicleTypes} />
        </div>
      </section>
    </div>
  );
}
