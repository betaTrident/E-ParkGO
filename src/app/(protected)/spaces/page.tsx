import { redirect } from "next/navigation";

import { requireActiveProfile } from "@/lib/auth/session";

export default async function SpacesPage() {
  const profile = await requireActiveProfile();

  if (profile.role === "ADMIN") {
    redirect("/admin/settings");
  }

  redirect("/dashboard");
}
