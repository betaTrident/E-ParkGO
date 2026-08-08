import * as React from "react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg?: string;
  className?: string;
}

export function KpiCard({
  title,
  value,
  hint,
  icon: Icon,
  iconBg = "bg-primary/10 text-primary",
  className,
}: KpiCardProps) {
  return (
    <article className={cn("kpi-card", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="kpi-label">{title}</span>
        <span className={cn("kpi-icon-wrap", iconBg)}>
          <Icon className="size-4" />
        </span>
      </div>
      <div>
        <p className="kpi-value">{value}</p>
        {hint && <p className="kpi-hint mt-1">{hint}</p>}
      </div>
    </article>
  );
}
