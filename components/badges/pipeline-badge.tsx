import { CreditCard, Layers, RefreshCcw, ShoppingCart, Workflow } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { badgeBaseClassName } from "@/components/badges/badge-base";
import { pipelineLabel } from "@/lib/format/labels";
import { cn } from "@/lib/utils";

const pipelineTreatments: Record<
  string,
  { icon: LucideIcon; className: string }
> = {
  "payment-degradation": {
    icon: CreditCard,
    className:
      "border-brand-indigo/35 bg-brand-indigo/10 text-brand-indigo-readable",
  },
  "checkout-dropoff": {
    icon: ShoppingCart,
    className:
      "border-brand-emerald/35 bg-brand-emerald/10 text-brand-emerald-readable",
  },
  "failed-subscription": {
    icon: RefreshCcw,
    className: "border-foreground/25 bg-foreground/8 text-foreground",
  },
  all: {
    icon: Layers,
    className: "border-border bg-muted text-muted-foreground",
  },
};

const unknownPipelineTreatment = {
  icon: Workflow,
  className: "border-border bg-muted text-muted-foreground",
};

type PipelineBadgeProps = {
  pipeline: string;
  className?: string;
};

export function PipelineBadge({ pipeline, className }: PipelineBadgeProps) {
  const treatment = pipelineTreatments[pipeline] ?? unknownPipelineTreatment;
  const Icon = treatment.icon;

  return (
    <span className={cn(badgeBaseClassName, treatment.className, className)}>
      <Icon className="size-3.5" />
      {pipelineLabel(pipeline)}
    </span>
  );
}
