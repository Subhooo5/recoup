import { CircleCheck, CircleSlash } from "lucide-react";

import { PipelineBadge } from "@/components/badges/pipeline-badge";
import type { PolicyItem } from "@/lib/api/response-types";
import { describePolicy } from "@/lib/format/policy-description";
import { ruleTypeLabel } from "@/lib/format/labels";
import { cn } from "@/lib/utils";

type PolicyCardProps = {
  policy: PolicyItem;
};

export function PolicyCard({ policy }: PolicyCardProps) {
  const description = describePolicy(policy.ruleType, policy.config);

  return (
    <article
      className={cn(
        "grid content-start gap-3 rounded-xl border p-5 transition-colors duration-200",
        policy.active
          ? "border-border bg-card"
          : "border-dashed border-border bg-muted/40",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <h3
          className={cn(
            "font-heading text-base font-semibold tracking-tight",
            !policy.active && "text-muted-foreground line-through",
          )}
        >
          {policy.name}
        </h3>
        <span
          className={cn(
            "ml-auto inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium",
            policy.active
              ? "border-brand-emerald/35 bg-brand-emerald/10 text-brand-emerald-readable"
              : "border-border bg-muted text-muted-foreground",
          )}
        >
          {policy.active ? (
            <CircleCheck className="size-3.5" />
          ) : (
            <CircleSlash className="size-3.5" />
          )}
          {policy.active ? "Enforced" : "Inactive"}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <PipelineBadge pipeline={policy.pipeline} />
        <span className="rounded-md border border-border bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
          {ruleTypeLabel(policy.ruleType)}
        </span>
      </div>

      {description ? (
        <p
          className={cn(
            "text-sm text-pretty",
            policy.active ? "text-muted-foreground" : "text-muted-foreground/70",
          )}
        >
          {description}
        </p>
      ) : (
        <pre className="overflow-x-auto rounded-lg border border-border bg-muted/50 p-3 font-mono text-[11px] leading-relaxed">
          {JSON.stringify(policy.config, null, 2)}
        </pre>
      )}

      {policy.active ? null : (
        <p className="text-xs text-muted-foreground">
          This rule is recorded but not enforced. The gate only reads active
          policies.
        </p>
      )}
    </article>
  );
}
