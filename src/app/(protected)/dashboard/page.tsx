import { DashboardView } from "@/components/dashboard/dashboard-view";
import { fetchDashboardSnapshot } from "@/features/dashboard/service";
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
  const snapshot = await fetchDashboardSnapshot();

  return (
    <DashboardView
      profile={profile}
      initialSnapshot={snapshot}
      {...(snapshot
        ? {}
        : {
            loadError:
              'Unable to load the operational dashboard snapshot. Try refreshing in a moment.',
          })}
      {...(params.error === SIGN_OUT_ERROR
        ? { signOutError: SIGN_OUT_ERROR }
        : {})}
    />
  );
}
