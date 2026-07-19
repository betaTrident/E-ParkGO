/**
 * Accepts application-local paths while rejecting absolute, protocol-relative,
 * and backslash-based URL forms that browsers may interpret as another origin.
 */
export function getSafeRedirectPath(
  candidate: string | null | undefined,
  fallback: string,
): string {
  if (
    !candidate ||
    !candidate.startsWith("/") ||
    candidate.startsWith("//") ||
    candidate.includes("\\")
  ) {
    return fallback;
  }

  return candidate;
}
