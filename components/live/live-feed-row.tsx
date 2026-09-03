"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, ExternalLink } from "lucide-react";
import { useState } from "react";

import { ActorBadge } from "@/components/badges/actor-badge";
import { PipelineBadge } from "@/components/badges/pipeline-badge";
import { summarizeAuditEntry } from "@/lib/format/audit-entry-summary";
import { auditActionLabel } from "@/lib/format/labels";
import { formatAbsoluteTime, formatRelativeTime } from "@/lib/format/time";
import { cn } from "@/lib/utils";

export type FeedRowEntry = {
  id: string;
  actor: string;
  action: string;
  detail: unknown;
  createdAt: string;
  pipeline?: string | null;
  caseId?: string | null;
  customerName?: string | null;
};

type LiveFeedRowProps = {
  entry: FeedRowEntry;
  nowMilliseconds: number;
  showCaseLink?: boolean;
};

export function LiveFeedRow({
  entry,
  nowMilliseconds,
  showCaseLink = true,
}: LiveFeedRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const summary = summarizeAuditEntry(entry.action, entry.detail);

  return (
    <motion.li
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className="border-b border-border/70 last:border-b-0"
    >
      <div className="flex items-start gap-2 px-3 py-2.5 transition-colors duration-200 hover:bg-muted/40">
        <button
          type="button"
          onClick={() => setIsExpanded((expanded) => !expanded)}
          aria-expanded={isExpanded}
          className="flex min-w-0 flex-1 cursor-pointer items-start gap-3 text-left"
        >
          <span
            title={formatAbsoluteTime(entry.createdAt)}
            className="mt-0.5 w-16 shrink-0 font-mono text-xs tabular-nums text-muted-foreground"
          >
            {formatRelativeTime(entry.createdAt, nowMilliseconds)}
          </span>

          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-1.5">
              {entry.pipeline ? <PipelineBadge pipeline={entry.pipeline} /> : null}
              <ActorBadge actor={entry.actor} />
              <span className="text-sm font-medium">
                {auditActionLabel(entry.action)}
              </span>
              {entry.customerName ? (
                <span className="text-xs text-muted-foreground">
                  {entry.customerName}
                </span>
              ) : null}
            </span>
            {summary ? (
              <span className="mt-1 block truncate text-xs text-muted-foreground">
                {summary}
              </span>
            ) : null}
          </span>

          <ChevronDown
            className={cn(
              "mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform duration-200 ease-out",
              isExpanded && "rotate-180",
            )}
          />
        </button>

        {showCaseLink && entry.caseId ? (
          <Link
            href={`/cases/${entry.caseId}`}
            className="mt-0.5 inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-md border border-border px-2 py-0.5 text-xs font-medium text-muted-foreground transition-colors duration-200 hover:border-brand-indigo/50 hover:text-brand-indigo-readable"
          >
            <ExternalLink className="size-3" />
            Case
          </Link>
        ) : null}
      </div>

      <AnimatePresence initial={false}>
        {isExpanded ? (
          <motion.div
            key="detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <pre className="mx-3 mb-3 overflow-x-auto rounded-lg border border-border bg-muted/50 p-3 font-mono text-[11px] leading-relaxed">
              {JSON.stringify(entry.detail, null, 2)}
            </pre>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.li>
  );
}
