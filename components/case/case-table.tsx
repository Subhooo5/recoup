"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  FolderOpen,
  SearchX,
} from "lucide-react";
import { useState } from "react";

import { PipelineBadge } from "@/components/badges/pipeline-badge";
import { StatusBadge } from "@/components/badges/status-badge";
import { EmptyState } from "@/components/data/empty-state";
import { ErrorState } from "@/components/data/error-state";
import { LoadingSkeleton } from "@/components/data/loading-skeleton";
import type { CaseListResponse } from "@/lib/api/response-types";
import { formatOptionalRupees } from "@/lib/format/currency";
import { countLabel, diagnosisLabel } from "@/lib/format/labels";
import {
  endOfDayIsoString,
  formatAbsoluteTime,
  formatRelativeTime,
  startOfDayIsoString,
} from "@/lib/format/time";
import { useCurrentTime } from "@/lib/hooks/use-current-time";
import {
  useCaseFilters,
  type CaseFilterValues,
  type CaseSortField,
} from "@/lib/hooks/use-case-filters";
import { cn } from "@/lib/utils";

const buildCaseRequestUrl = (values: CaseFilterValues) => {
  const params = new URLSearchParams();

  if (values.customerId) {
    params.set("customerId", values.customerId);
  }

  if (values.pipeline) {
    params.set("pipeline", values.pipeline);
  }

  if (values.status) {
    params.set("status", values.status);
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

  params.set("sort", values.sort);
  params.set("direction", values.direction);

  return `/api/cases?${params.toString()}`;
};

const headerCellClassName =
  "px-4 py-2.5 text-left text-xs font-medium text-muted-foreground";

function SortableHeader({
  label,
  field,
  activeField,
  direction,
  onToggle,
  align = "left",
}: {
  label: string;
  field: CaseSortField;
  activeField: CaseSortField;
  direction: "asc" | "desc";
  onToggle: (field: CaseSortField) => void;
  align?: "left" | "right";
}) {
  const isActive = activeField === field;
  const Icon = !isActive ? ArrowUpDown : direction === "asc" ? ArrowUp : ArrowDown;

  return (
    <th
      scope="col"
      className={cn(headerCellClassName, align === "right" && "text-right")}
    >
      <button
        type="button"
        onClick={() => onToggle(field)}
        aria-label={`Sort by ${label}`}
        className={cn(
          "inline-flex cursor-pointer items-center gap-1 transition-colors duration-200 hover:text-foreground",
          isActive && "text-foreground",
        )}
      >
        {label}
        <Icon className="size-3.5" />
      </button>
    </th>
  );
}

function CaseIdentifierCell({ caseId }: { caseId: string }) {
  const [hasCopied, setHasCopied] = useState(false);

  const copyCaseId = async (event: React.MouseEvent) => {
    event.stopPropagation();
    await navigator.clipboard.writeText(caseId);
    setHasCopied(true);
    window.setTimeout(() => setHasCopied(false), 1500);
  };

  return (
    <span className="flex items-center gap-1.5">
      <Link
        href={`/cases/${caseId}`}
        title={caseId}
        onClick={(event) => event.stopPropagation()}
        className="cursor-pointer font-mono text-xs transition-colors duration-200 hover:text-brand-indigo-readable"
      >
        {caseId.slice(0, 8)}…
      </Link>
      <button
        type="button"
        onClick={copyCaseId}
        aria-label={`Copy full case id ${caseId}`}
        className="cursor-pointer text-muted-foreground transition-colors duration-200 hover:text-foreground"
      >
        {hasCopied ? (
          <Check className="size-3.5 text-brand-emerald-readable" />
        ) : (
          <Copy className="size-3.5" />
        )}
      </button>
    </span>
  );
}

export function CaseTable() {
  const router = useRouter();
  const nowMilliseconds = useCurrentTime();
  const { values, hasActiveFilters, clearFilters, goToPage, toggleSort } =
    useCaseFilters();

  const casesQuery = useQuery({
    queryKey: ["cases", values],
    queryFn: async () => {
      const response = await fetch(buildCaseRequestUrl(values));

      if (!response.ok) {
        throw new Error(`Case request failed with status ${response.status}`);
      }

      return (await response.json()) as CaseListResponse;
    },
    placeholderData: keepPreviousData,
  });

  if (casesQuery.isPending) {
    return <LoadingSkeleton shape="row-list" count={8} />;
  }

  if (casesQuery.isError) {
    return (
      <ErrorState
        heading="Cases could not be loaded"
        message={
          casesQuery.error instanceof Error
            ? casesQuery.error.message
            : "The case list request failed."
        }
        onRetry={() => {
          casesQuery.refetch();
        }}
        isRetrying={casesQuery.isFetching}
      />
    );
  }

  const { items, total, page, pageSize } = casesQuery.data;
  const pageCount = Math.max(Math.ceil(total / pageSize), 1);

  if (total === 0) {
    return hasActiveFilters ? (
      <EmptyState
        icon={SearchX}
        heading="No cases match these filters"
        body="No recovery case matches the current customer, pipeline, status and date range."
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
        icon={FolderOpen}
        heading="No cases yet"
        body="No revenue has been detected at risk so far. Run a pipeline from the Simulator to open the first recovery case."
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
          "overflow-x-auto rounded-xl border border-border transition-opacity duration-200",
          casesQuery.isFetching && "opacity-60",
        )}
      >
        <table className="w-full border-collapse text-sm">
          <thead className="border-b border-border bg-muted/40">
            <tr>
              <th scope="col" className={headerCellClassName}>
                Case
              </th>
              <th scope="col" className={headerCellClassName}>
                Pipeline
              </th>
              <th scope="col" className={headerCellClassName}>
                Customer
              </th>
              <SortableHeader
                label="Amount"
                field="amount"
                activeField={values.sort}
                direction={values.direction}
                onToggle={toggleSort}
                align="right"
              />
              <th scope="col" className={headerCellClassName}>
                Diagnosis
              </th>
              <th scope="col" className={headerCellClassName}>
                Status
              </th>
              <th scope="col" className={cn(headerCellClassName, "text-right")}>
                Actions
              </th>
              <SortableHeader
                label="Created"
                field="createdAt"
                activeField={values.sort}
                direction={values.direction}
                onToggle={toggleSort}
              />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((recoveryCase) => (
              <tr
                key={recoveryCase.id}
                onClick={() => router.push(`/cases/${recoveryCase.id}`)}
                className="cursor-pointer transition-colors duration-200 hover:bg-muted/40"
              >
                <td className="px-4 py-3">
                  <CaseIdentifierCell caseId={recoveryCase.id} />
                </td>
                <td className="px-4 py-3">
                  <PipelineBadge pipeline={recoveryCase.pipeline} />
                </td>
                <td className="px-4 py-3">
                  {recoveryCase.customer?.name ?? "—"}
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs tabular-nums">
                  {formatOptionalRupees(recoveryCase.amount)}
                </td>
                <td className="max-w-52 truncate px-4 py-3">
                  {recoveryCase.diagnosis === null
                    ? "—"
                    : diagnosisLabel(recoveryCase.diagnosis)}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={recoveryCase.status} />
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs tabular-nums">
                  {recoveryCase.actionCount}
                </td>
                <td
                  className="px-4 py-3 text-xs text-muted-foreground"
                  title={formatAbsoluteTime(recoveryCase.createdAt)}
                >
                  {formatRelativeTime(recoveryCase.createdAt, nowMilliseconds)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Page {page} of {pageCount} · {countLabel(total, "case")}
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

      {items.length === 0 ? (
        <EmptyState
          icon={SearchX}
          heading="Nothing on this page"
          body="This page is past the end of the current result set."
          action={
            <button
              type="button"
              onClick={() => goToPage(1)}
              className="inline-flex h-9 cursor-pointer items-center rounded-xl border border-border px-3 text-sm font-medium transition-colors duration-200 hover:bg-muted"
            >
              Back to the first page
            </button>
          }
        />
      ) : null}
    </div>
  );
}
