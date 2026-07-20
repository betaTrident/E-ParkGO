import { StaffManagement } from "@/features/staff/components/staff-management";
import { listStaffMembers } from "@/features/staff/service";
import { requireAdminProfile } from "@/lib/auth/session";

export default async function AdminStaffPage() {
  const profile = await requireAdminProfile();
  const staffMembers = await listStaffMembers(profile);

  return (
    <StaffManagement currentProfile={profile} staffMembers={staffMembers} />
  );
}
