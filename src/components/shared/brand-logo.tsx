import Image from "next/image";

import logoMark from "@/app/assets/logo/1.svg";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
  compact?: boolean;
  priority?: boolean;
}

export function BrandLogo({
  className,
  compact = false,
  priority = false,
}: BrandLogoProps) {
  return (
    <span
      className={cn(
        "relative inline-flex h-10 shrink-0 items-center overflow-hidden",
        compact ? "w-24" : "w-32",
        className,
      )}
    >
      <Image
        src={logoMark}
        alt="E-ParkGO"
        fill
        sizes={compact ? "96px" : "128px"}
        priority={priority}
        className="scale-[2.6] object-contain"
      />
    </span>
  );
}
