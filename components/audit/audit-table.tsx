"use client";

import Link from "next/link";
import { AnimatePresence } from "motion/react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, ScrollText, SearchX } from "lucide-react";

import { EmptyState } from "@/components/data/empty-state";
import { ErrorState } from "@/components/data/error-state";
import { LoadingSkeleton } from "@/components/data/loading-skeleton";
import { LiveFeedRow } from "@/components/live/live-feed-row";
import type { AuditListResponse } from "@/lib/api/response-types";
import { countLabel } from "@/lib/format/labels";
import { endOfDayIsoString, startOfDayIsoString } from "@/lib/format/time";
import { useCurrentTime } from "@/lib/hooks/use-current-time";
import {
  useAuditFilters,
  type AuditFilterValues,
} from "@/lib/hooks/use-audit-filters";
import { cn } from "@/lib/utils";

const buildAuditRequestUrl = (values: AuditFilterValues) => {
  const params = new URLSearchParams();

  if (values.entityType) {
    params.set("entityType", values.entityType);
  }

  if (values.actor) {
    params.set("actor", values.actor);
  }

  if (values.action) {
    params.set("action", values.action);
  }

  const from = values.from ? startOfDayIsoString(values.from) : null;
  const to = values.to ? endOfDayIsoString(values.to) : null;

  if (from) {
    params.set("from", from);
  }

  if (to) {
    params.set("to", to);
  }

  if (values.page > 1) {
    params.set("page", String(values.page));
  }

  const query = params.toString();

  return query ? `/api/audit?${query}` : "/api/audit";
};

export function AuditTable() {
  const nowMilliseconds = useCurrentTime();
  const { values, hasActiveFilters, clearFilters, goToPage } = useAuditFilters();

  const auditQuery = useQuery({
    queryKey: ["audit", values],
    queryFn: async () => {
      const response = await fetch(buildAuditRequestUrl(values));

      if (!response.ok) {
        throw new Error(`Audit request failed with status ${response.status}`);
      }

      return (await response.json()) as AuditListResponse;
    },
    placeholderData: keepPreviousData,
  });

  if (auditQuery.isPending) {
    return <LoadingSkeleton shape="row-list" count={10} />;
  }

  if (auditQuery.isError) {
    return (
      <ErrorState
        heading="The audit ledger could not be loaded"
        message={
          auditQuery.error instanceof Error
            ? auditQuery.error.message
            : "The audit request failed."
        }
        onRetry={() => {
          auditQuery.refetch();
        }}
        isRetrying={auditQuery.isFetching}
      />
    );
  }

  const { items, total, page, pageSize } = auditQuery.data;
  const pageCount = Math.max(Math.ceil(total / pageSize), 1);

  if (total === 0) {
    return hasActiveFilters ? (
      <EmptyState
        icon={SearchX}
        heading="No entries match these filters"
        body="No ledger entry matches the current actor, entity type, action and date range."
        action={
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex h-9 cursor-pointer items-center rounded-xl border border-border px-3 text-sm font-medium transition-colors duration-200 hover:bg-muted"
          >
            Clear filters
          </button>
        }
      />
    ) : (
      <EmptyState
        icon={ScrollText}
        heading="No audit activity yet"
        body="Nothing has been written to the ledger. Run a pipeline from the Simulator and every step it takes will be recorded here."
        action={
          <Link
            href="/simulator"
            className="inline-flex h-9 cursor-pointer items-center rounded-xl bg-foreground px-4 text-sm font-medium text-background transition-opacity duration-200 hover:opacity-90 dark:bg-gradient-to-r dark:from-brand-indigo dark:to-brand-emerald dark:text-white"
          >
            Open the Simulator
          </Link>
        }
      />
    );
  }

  return (
    <div className="grid gap-3">
      <div
        className={cn(
          "overflow-hidden rounded-xl border border-border transition-opacity duration-200",
          auditQuery.isFetching && "opacity-60",
        )}
      >
        <ol>
          <AnimatePresence initial={false}>
            {items.map((entry) => (
              <LiveFeedRow
                key={entry.id}
                entry={{
                  id: entry.id,
                  actor: entry.actor,
                  action: entry.action,
                  detail: entry.detail,
                  createdAt: entry.createdAt,
                  caseId:
                    entry.entityType === "RecoveryCase" ? entry.entityId : null,
                }}
                nowMilliseconds={nowMilliseconds}
              />
            ))}
          </AnimatePresence>
        </ol>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Page {page} of {pageCount} · {countLabel(total, "entry", "entries")}
          {hasActiveFilters ? " matching these filters" : ""}
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => goToPage(page - 1)}
            disabled={page <= 1}
            className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-md border border-border px-2.5 text-xs font-medium transition-colors duration-200 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronLeft className="size-3.5" />
            Previous
          </button>
          <button
            type="button"
            onClick={() => goToPage(page + 1)}
            disabled={page >= pageCount}
            className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-md border border-border px-2.5 text-xs font-medium transition-colors duration-200 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
            <ChevronRight className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
