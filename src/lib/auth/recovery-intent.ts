import { cookies } from "next/headers";

export const RECOVERY_INTENT_COOKIE = "eparkgo-recovery-intent";

export async function hasRecoveryIntent(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(RECOVERY_INTENT_COOKIE)?.value === "1";
}

export async function clearRecoveryIntent(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(RECOVERY_INTENT_COOKIE);
}
