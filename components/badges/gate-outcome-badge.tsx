import { CircleHelp, CircleSlash, ShieldCheck, ShieldX, UserRoundCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { gateOutcomeLabel } from "@/lib/format/labels";
import { cn } from "@/lib/utils";

const outcomeTreatments: Record<
  string,
  { icon: LucideIcon; className: string }
> = {
  allow: {
    icon: ShieldCheck,
    className: "border-transparent bg-brand-emerald text-white",
  },
  block: {
    icon: ShieldX,
    className: "border-transparent bg-destructive text-white",
  },
  human_review: {
    icon: UserRoundCheck,
    className:
      "border-dashed border-brand-indigo/60 bg-brand-indigo/10 text-brand-indigo-readable",
  },
  no_action: {
    icon: CircleSlash,
    className: "border-border bg-muted text-muted-foreground",
  },
};

const unknownOutcomeTreatment = {
  icon: CircleHelp,
  className: "border-border bg-muted text-muted-foreground",
};

const sizeClassNames = {
  default: "gap-1.5 px-2 py-0.5 text-xs",
  large: "gap-2 px-3 py-1.5 text-sm",
};

type GateOutcomeBadgeProps = {
  outcome: string | null;
  size?: keyof typeof sizeClassNames;
  className?: string;
};

export function GateOutcomeBadge({
  outcome,
  size = "default",
  className,
}: GateOutcomeBadgeProps) {
  const treatment =
    (outcome === null ? null : outcomeTreatments[outcome]) ??
    unknownOutcomeTreatment;
  const Icon = treatment.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border font-medium whitespace-nowrap",
        sizeClassNames[size],
        treatment.className,
        className,
      )}
    >
      <Icon className={size === "large" ? "size-4" : "size-3.5"} />
      {outcome === null ? "Not evaluated" : gateOutcomeLabel(outcome)}
    </span>
  );
}
