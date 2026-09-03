import { CircleCheck, CircleHelp, CircleMinus, Hourglass, OctagonX } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { badgeBaseClassName } from "@/components/badges/badge-base";
import { caseStatusLabel } from "@/lib/format/labels";
import { cn } from "@/lib/utils";

const statusTreatments: Record<
  string,
  { icon: LucideIcon | null; className: string; showLiveDot?: boolean }
> = {
  open: {
    icon: null,
    className: "border-foreground/25 bg-foreground/5 text-foreground",
    showLiveDot: true,
  },
  awaiting_review: {
    icon: Hourglass,
    className:
      "border-dashed border-brand-indigo/60 bg-brand-indigo/10 text-brand-indigo-readable",
  },
  resolved: {
    icon: CircleCheck,
    className: "border-transparent bg-brand-emerald text-white",
  },
  blocked: {
    icon: OctagonX,
    className: "border-destructive/45 bg-destructive/10 text-destructive",
  },
  closed: {
    icon: CircleMinus,
    className: "border-border bg-muted text-muted-foreground",
  },
};

const unknownStatusTreatment = {
  icon: CircleHelp,
  className: "border-border bg-muted text-muted-foreground",
};

type StatusBadgeProps = {
  status: string;
  className?: string;
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const treatment = statusTreatments[status] ?? unknownStatusTreatment;
  const Icon = treatment.icon;

  return (
    <span className={cn(badgeBaseClassName, treatment.className, className)}>
      {treatment.showLiveDot ? (
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand-indigo/60" />
          <span className="relative inline-flex size-2 rounded-full bg-brand-indigo" />
        </span>
      ) : null}
      {Icon ? <Icon className="size-3.5" /> : null}
      {caseStatusLabel(status)}
    </span>
  );
}
