import { DashboardView } from "@/components/dashboard/dashboard-view";
import { requireActiveProfile } from "@/lib/auth/session";

interface DashboardPageProps {
  searchParams: Promise<{ error?: string }>;
}

const SIGN_OUT_ERROR = "Unable to sign out. Please try again.";

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const params = await searchParams;
  const profile = await requireActiveProfile();

  return (
    <DashboardView
      profile={profile}
      {...(params.error === SIGN_OUT_ERROR ? { error: SIGN_OUT_ERROR } : {})}
    />
  );
}
