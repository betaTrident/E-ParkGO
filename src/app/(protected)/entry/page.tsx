import { EntryForm } from "@/features/entry/components/entry-form";
import {
  listSpaces,
  listVehicleTypes,
} from "@/features/spaces/service";
import { requireActiveProfile } from "@/lib/auth/session";

export default async function EntryPage() {
  const profile = await requireActiveProfile();
  const [spaces, vehicleTypes] = await Promise.all([
    listSpaces(profile.parking_location_id, { status: "AVAILABLE" }),
    listVehicleTypes(profile.parking_location_id),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8 sm:px-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-blue-600 dark:text-blue-300">
          Operations
        </p>
        <h1 className="text-3xl font-bold tracking-tight">Vehicle entry</h1>
        <p className="max-w-2xl text-slate-600 dark:text-slate-400">
          Create a parking entry, issue a one-time QR ticket, and print it
          immediately. The raw credential is kept only in this browser session.
        </p>
      </header>

      <EntryForm spaces={spaces} vehicleTypes={vehicleTypes} />
    </div>
  );
}
