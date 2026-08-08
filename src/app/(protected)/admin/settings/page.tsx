import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { SectionPanel } from "@/components/shared/section-panel";
import { SpaceEditor } from "@/components/spaces/space-editor";
import {
  CapacitySettingsForm,
  GeneralSettingsForm,
} from "@/features/facility/components/facility-settings-form";
import { getFacilitySettings } from "@/features/facility/service";
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
      <div className="page-root">
        <p role="alert" className="text-sm font-medium text-destructive">
          Facility settings could not be loaded for your location.
        </p>
      </div>
    );
  }

  return (
    <div className="page-root">
      <PageHeader
        title="Facility settings"
        description="Configure facility identity, timezone, capacity pools, zones, and vehicle types."
        badge={<Badge variant="outline">Admin</Badge>}
      />

      <Tabs defaultValue="general" className="w-full">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="capacity">Capacity Pools</TabsTrigger>
          <TabsTrigger value="spaces">Zones &amp; Spaces</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-4">
          <SectionPanel
            title="General settings"
            description="Facility identity, timezone, and receipt formatting."
          >
            <GeneralSettingsForm settings={settings} />
          </SectionPanel>
        </TabsContent>

        <TabsContent value="capacity" className="mt-4">
          <SectionPanel
            title="Capacity pools"
            description="Set maximum vehicle occupancy limits for real-time entry validation."
          >
            <CapacitySettingsForm settings={settings} />
          </SectionPanel>
        </TabsContent>

        <TabsContent value="spaces" className="mt-4">
          <SectionPanel
            title="Zones, types, and spaces"
            description="Configure facility zones, vehicle type mappings, and space inventory."
          >
            <SpaceEditor zones={zones} vehicleTypes={vehicleTypes} />
          </SectionPanel>
        </TabsContent>
      </Tabs>
    </div>
  );
}
