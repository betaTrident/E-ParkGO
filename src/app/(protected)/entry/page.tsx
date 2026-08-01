import { fetchDashboardSnapshot } from "@/features/dashboard/service";
import { EntryPageView } from "@/features/entry/components/entry-page-view";
import { listVehicleTypes } from "@/features/spaces/service";
import { requireActiveProfile } from "@/lib/auth/session";

export default async function EntryPage() {
  const profile = await requireActiveProfile();
  const [vehicleTypes, snapshot] = await Promise.all([
    listVehicleTypes(profile.parking_location_id),
    fetchDashboardSnapshot(),
  ]);

  return (
    <EntryPageView vehicleTypes={vehicleTypes} snapshot={snapshot} />
  );
}
