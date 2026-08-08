import * as React from "react";
import { cn } from "@/lib/utils";

interface SectionPanelProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}

export function SectionPanel({
  title,
  description,
  headerAction,
  children,
  className,
  bodyClassName,
}: SectionPanelProps) {
  return (
    <section className={cn("panel", className)}>
      <div className="panel-header">
        <div>
          <h2 className="panel-title">{title}</h2>
          {description && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {headerAction && <div className="flex items-center gap-2">{headerAction}</div>}
      </div>
      <div className={cn("panel-body", bodyClassName)}>{children}</div>
    </section>
  );
}
