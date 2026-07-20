import { SpacesView } from "@/components/spaces/spaces-view";
import { SpaceEditor } from "@/components/spaces/space-editor";
import { listSpaces, listVehicleTypes, listZones } from "@/features/spaces/service";
import { requireActiveProfile } from "@/lib/auth/session";

export default async function SpacesPage() {
  const profile = await requireActiveProfile();
  const [spaces, zones, vehicleTypes] = await Promise.all([
    listSpaces(profile.parking_location_id),
    listZones(profile.parking_location_id),
    listVehicleTypes(profile.parking_location_id),
  ]);

  const isAdmin = profile.role === "ADMIN";

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-blue-600 dark:text-blue-300">
          Operations
        </p>
        <h1 className="text-3xl font-bold tracking-tight">Parking spaces</h1>
        <p className="max-w-2xl text-slate-600 dark:text-slate-400">
          Same-location availability board for staff and administrators. Status
          text is provided in addition to color for accessibility.
        </p>
      </header>

      {isAdmin ? (
        <section aria-label="Space configuration">
          <SpaceEditor zones={zones} vehicleTypes={vehicleTypes} />
        </section>
      ) : null}

      <SpacesView
        spaces={spaces}
        zones={zones.map((zone) => ({
          id: zone.id,
          code: zone.code,
          name: zone.name,
        }))}
        isAdmin={isAdmin}
      />
    </div>
  );
}
