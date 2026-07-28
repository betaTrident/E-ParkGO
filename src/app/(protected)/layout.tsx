import { requireActiveProfile } from "@/lib/auth/session";
import { ProtectedShell } from "./shell";

export default async function ProtectedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const profile = await requireActiveProfile();
  return <ProtectedShell profile={profile}>{children}</ProtectedShell>;
}
