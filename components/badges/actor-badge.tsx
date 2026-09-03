import { CircleHelp, Cpu, Sparkles, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { badgeBaseClassName } from "@/components/badges/badge-base";
import { actorLabel } from "@/lib/format/labels";
import { cn } from "@/lib/utils";

const actorTreatments: Record<
  string,
  { icon: LucideIcon; className: string }
> = {
  agent: {
    icon: Sparkles,
    className:
      "border-transparent bg-gradient-to-r from-brand-indigo to-brand-emerald text-white shadow-sm shadow-brand-indigo/25",
  },
  system: {
    icon: Cpu,
    className: "border-border bg-muted font-mono text-muted-foreground",
  },
  human: {
    icon: UserRound,
    className: "border-foreground/40 bg-transparent text-foreground",
  },
};

const unknownActorTreatment = {
  icon: CircleHelp,
  className: "border-border bg-muted text-muted-foreground",
};

type ActorBadgeProps = {
  actor: string;
  className?: string;
};

export function ActorBadge({ actor, className }: ActorBadgeProps) {
  const treatment = actorTreatments[actor] ?? unknownActorTreatment;
  const Icon = treatment.icon;

  return (
    <span className={cn(badgeBaseClassName, treatment.className, className)}>
      <Icon className="size-3.5" />
      {actorLabel(actor)}
    </span>
  );
}
