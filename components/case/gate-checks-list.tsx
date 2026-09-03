import { CircleCheck, CircleX } from "lucide-react";

import { gateCheckLabel } from "@/lib/format/labels";
import type { GateCheck } from "@/lib/format/gate-result";
import { cn } from "@/lib/utils";

type GateChecksListProps = {
  checks: GateCheck[];
  blockingCheck: string | null;
};

export function GateChecksList({ checks, blockingCheck }: GateChecksListProps) {
  if (checks.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No policy checks were recorded for this action.
      </p>
    );
  }

  const passedCount = checks.filter((check) => check.passed).length;

  return (
    <div className="grid gap-3">
      <p className="text-xs text-muted-foreground">
        {checks.length} deterministic checks ran in plain code before anything
        could execute · {passedCount} passed · {checks.length - passedCount}{" "}
        failed
      </p>

      <ol className="grid gap-2">
        {checks.map((check) => {
          const isBlocking = check.name === blockingCheck;

          return (
            <li
              key={check.name}
              className={cn(
                "grid gap-1 rounded-xl border px-3 py-2.5 transition-colors duration-200",
                check.passed
                  ? "border-border bg-background"
                  : "border-destructive/40 bg-destructive/5",
                isBlocking && "ring-2 ring-destructive/30",
              )}
            >
              <div className="flex flex-wrap items-center gap-2">
                {check.passed ? (
                  <CircleCheck className="size-4 shrink-0 text-brand-emerald" />
                ) : (
                  <CircleX className="size-4 shrink-0 text-destructive" />
                )}
                <span className="text-sm font-medium">
                  {gateCheckLabel(check.name)}
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {check.name}
                </span>
                {isBlocking ? (
                  <span className="ml-auto rounded-md bg-destructive px-2 py-0.5 text-[11px] font-medium text-white">
                    Blocking check
                  </span>
                ) : null}
              </div>
              <p
                className={cn(
                  "pl-6 text-xs",
                  check.passed ? "text-muted-foreground" : "text-destructive",
                )}
              >
                {check.detail}
              </p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
