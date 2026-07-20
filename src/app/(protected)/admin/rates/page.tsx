import { RateEditor } from "@/features/rates/components/rate-editor";
import { RateVersionList } from "@/features/rates/components/rate-version-list";
import { listRateVersions } from "@/features/rates/service";
import { listVehicleTypes } from "@/features/spaces/service";
import { requireAdminProfile } from "@/lib/auth/session";

export default async function AdminRatesPage() {
  const profile = await requireAdminProfile();
  const [rates, vehicleTypes] = await Promise.all([
    listRateVersions(profile.parking_location_id),
    listVehicleTypes(profile.parking_location_id),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-8 sm:px-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-blue-600 dark:text-blue-300">
          Administration
        </p>
        <h1 className="text-3xl font-bold tracking-tight">Rates</h1>
        <p className="max-w-2xl text-slate-600 dark:text-slate-400">
          Versioned, effective-dated tariffs. Published rows are immutable;
          overlapping windows are rejected at publish time.
        </p>
      </header>

      <RateEditor vehicleTypes={vehicleTypes} />

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Versions</h2>
        <RateVersionList rates={rates} />
      </section>
    </div>
  );
}
