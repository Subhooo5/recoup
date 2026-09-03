"use client";

import { AnimatePresence } from "motion/react";

import { LiveFeedRow } from "@/components/live/live-feed-row";
import type { CaseAuditEntry } from "@/lib/api/response-types";
import { countLabel } from "@/lib/format/labels";
import { useCurrentTime } from "@/lib/hooks/use-current-time";

type CaseAuditRailProps = {
  auditTrail: CaseAuditEntry[];
};

export function CaseAuditRail({ auditTrail }: CaseAuditRailProps) {
  const nowMilliseconds = useCurrentTime();

  return (
    <aside className="lg:sticky lg:top-28">
      <div className="rounded-xl border border-border">
        <div className="border-b border-border px-4 py-3">
          <h2 className="font-heading text-sm font-semibold tracking-tight">
            Audit ledger
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {countLabel(auditTrail.length, "entry", "entries")} recorded for
            this case, oldest first
          </p>
        </div>

        {auditTrail.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">
            No audit entries were written for this case.
          </p>
        ) : (
          <ol className="max-h-[70vh] overflow-y-auto">
            <AnimatePresence initial={false}>
              {auditTrail.map((entry) => (
                <LiveFeedRow
                  key={entry.id}
                  entry={entry}
                  nowMilliseconds={nowMilliseconds}
                  showCaseLink={false}
                />
              ))}
            </AnimatePresence>
          </ol>
        )}
      </div>
    </aside>
  );
}
