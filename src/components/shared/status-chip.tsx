import * as React from "react";
import { cn } from "@/lib/utils";

interface StatusChipProps {
  status: string;
  dot?: boolean;
  className?: string;
}

function formatStatus(status: string): string {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getChipClass(status: string): string {
  const upper = status.toUpperCase();
  if (["ACTIVE", "PAID", "PUBLISHED", "COMPLETED"].includes(upper)) {
    return "chip-active";
  }
  if (
    [
      "PAYMENT_PENDING",
      "PAID_AWAITING_EXIT",
      "EXIT_PENDING",
      "DRAFT",
      "MANUAL_REVIEW",
      "DISABLED",
    ].includes(upper)
  ) {
    return "chip-pending";
  }
  if (["LOST_TICKET", "INFO"].includes(upper)) {
    return "chip-info";
  }
  return "chip-neutral";
}

export function StatusChip({ status, dot = true, className }: StatusChipProps) {
  const chipClass = getChipClass(status);
  return (
    <span className={cn("chip", chipClass, className)}>
      {dot && (
        <span className="size-1.5 rounded-full bg-current opacity-80" aria-hidden />
      )}
      {formatStatus(status)}
    </span>
  );
}
