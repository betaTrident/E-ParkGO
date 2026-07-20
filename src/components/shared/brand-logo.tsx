import type { CSSProperties } from "react";

import darkModeLogo from "@/app/assets/logo/Dark-mode-logo.svg";
import lightModeLogo from "@/app/assets/logo/Light-mode-logo.svg";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
  compact?: boolean;
  priority?: boolean;
}

export function BrandLogo({
  className,
  compact = false,
}: BrandLogoProps) {
  const logoVariables = {
    "--brand-logo-light": `url("${lightModeLogo.src}")`,
    "--brand-logo-dark": `url("${darkModeLogo.src}")`,
  } as CSSProperties;

  return (
    <span
      role="img"
      aria-label="E-ParkGO"
      style={logoVariables}
      className={cn(
        "brand-logo inline-flex shrink-0",
        compact ? "h-9 w-[7.25rem]" : "h-12 w-[9.5rem]",
        className,
      )}
    />
  );
}
