import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import {
  InviteStaffDialog,
  StaffManagement,
} from "@/features/staff/components/staff-management";
import { listStaffMembers } from "@/features/staff/service";
import { requireAdminProfile } from "@/lib/auth/session";

export default async function AdminStaffPage() {
  const profile = await requireAdminProfile();
  const staffMembers = await listStaffMembers(profile);

  return (
    <div className="page-root">
      <PageHeader
        title="Staff & users"
        description="Invite, disable, and manage permissions for staff in your assigned location. Cross-location access is blocked."
        badge={<Badge variant="outline">Admin</Badge>}
        action={<InviteStaffDialog />}
      />

      <StaffManagement currentProfile={profile} staffMembers={staffMembers} />
    </div>
  );
}
