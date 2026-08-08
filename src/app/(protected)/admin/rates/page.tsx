import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { SectionPanel } from "@/components/shared/section-panel";
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
    <div className="page-root">
      <PageHeader
        title="Rates"
        description="Versioned, effective-dated tariffs. Published rows are immutable; overlapping windows are rejected at publish time."
        badge={<Badge variant="outline">Admin only</Badge>}
        action={<RateEditor vehicleTypes={vehicleTypes} />}
      />

      <SectionPanel title="Rate versions" bodyClassName="p-0 overflow-hidden">
        <RateVersionList rates={rates} />
      </SectionPanel>
    </div>
  );
}
