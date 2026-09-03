import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type GradientBorderProps = {
  children: ReactNode;
  activateOn?: "always" | "hover";
  className?: string;
  contentClassName?: string;
};

export function GradientBorder({
  children,
  activateOn = "always",
  className,
  contentClassName,
}: GradientBorderProps) {
  return (
    <div
      className={cn(
        activateOn === "hover"
          ? "gradient-border-frame-on-hover"
          : "gradient-border-frame",
        "rounded-lg p-px",
        className,
      )}
    >
      <div className={cn("h-full rounded-lg bg-background", contentClassName)}>
        {children}
      </div>
    </div>
  );
}
