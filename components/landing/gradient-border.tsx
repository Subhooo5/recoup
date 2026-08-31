import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type GradientBorderProps = {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function GradientBorder({
  children,
  className,
  contentClassName,
}: GradientBorderProps) {
  return (
    <div className={cn("gradient-border-frame rounded-lg p-px", className)}>
      <div className={cn("h-full rounded-lg bg-background", contentClassName)}>
        {children}
      </div>
    </div>
  );
}
