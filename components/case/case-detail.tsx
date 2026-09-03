"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { FileQuestion, RotateCw } from "lucide-react";

import { PipelineBadge } from "@/components/badges/pipeline-badge";
import { StatusBadge } from "@/components/badges/status-badge";
import { CaseAuditRail } from "@/components/case/case-audit-rail";
import { CaseStepper } from "@/components/case/case-stepper";
import { EmptyState } from "@/components/data/empty-state";
import { ErrorState } from "@/components/data/error-state";
import { LoadingSkeleton } from "@/components/data/loading-skeleton";
import type { CaseDetailResponse } from "@/lib/api/response-types";
import { formatOptionalRupees } from "@/lib/format/currency";
import { formatAbsoluteTime, formatOptionalAbsoluteTime } from "@/lib/format/time";
import { cn } from "@/lib/utils";

class CaseNotFoundError extends Error {}

type CaseDetailProps = {
  caseId: string;
};

export function CaseDetail({ caseId }: CaseDetailProps) {
  const caseQuery = useQuery({
    queryKey: ["case", caseId],
    queryFn: async () => {
      const response = await fetch(`/api/cases/${encodeURIComponent(caseId)}`);

      if (response.status === 404) {
        throw new CaseNotFoundError("Recovery case not found");
      }

      if (!response.ok) {
        throw new Error(`Case request failed with status ${response.status}`);
      }

      return (await response.json()) as CaseDetailResponse;
    },
    retry: (failureCount, error) =>
      !(error instanceof CaseNotFoundError) && failureCount < 1,
  });

  if (caseQuery.isPending) {
    return <LoadingSkeleton shape="detail-page" />;
  }

  if (caseQuery.error instanceof CaseNotFoundError) {
    return (
      <EmptyState
        icon={FileQuestion}
        heading="No case with that id"
        body={`Nothing in the ledger matches ${caseId}. The case may never have existed, or the id may be mistyped.`}
        action={
          <Link
            href="/cases"
            className="inline-flex h-9 cursor-pointer items-center rounded-xl border border-border px-3 text-sm font-medium transition-colors duration-200 hover:bg-muted"
          >
            Back to all cases
          </Link>
        }
      />
    );
  }

  if (caseQuery.isError) {
    return (
      <ErrorState
        heading="This case could not be loaded"
        message={
          caseQuery.error instanceof Error
            ? caseQuery.error.message
            : "The case detail request failed."
        }
        onRetry={() => {
          caseQuery.refetch();
        }}
        isRetrying={caseQuery.isFetching}
      />
    );
  }

  const recoveryCase = caseQuery.data;

  return (
    <div className="grid gap-6">
      <header className="grid gap-4 rounded-xl border border-border p-5">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={recoveryCase.status} />
          <PipelineBadge pipeline={recoveryCase.pipeline} />
          <span className="font-mono text-xs text-muted-foreground">
            {recoveryCase.id}
          </span>
          <button
            type="button"
            onClick={() => {
              caseQuery.refetch();
            }}
            disabled={caseQuery.isFetching}
            className="ml-auto inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-border px-2.5 text-xs font-medium transition-colors duration-200 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RotateCw
              className={cn("size-3.5", caseQuery.isFetching && "animate-spin")}
            />
            Refresh
          </button>
        </div>

        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {recoveryCase.customer?.name ?? "Unattributed case"}
          </h1>
          {recoveryCase.customer ? (
            <p className="mt-1 text-sm text-muted-foreground">
              {recoveryCase.customer.email}
            </p>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">
              No customer is attached to this case.
            </p>
          )}
        </div>

        <dl className="grid gap-4 border-t border-border pt-4 sm:grid-cols-3">
          <div className="grid gap-0.5">
            <dt className="text-xs font-medium text-muted-foreground">
              Amount at risk
            </dt>
            <dd className="font-heading text-xl font-semibold tracking-tight">
              {formatOptionalRupees(recoveryCase.amount)}
            </dd>
          </div>
          <div className="grid gap-0.5">
            <dt className="text-xs font-medium text-muted-foreground">
              Opened
            </dt>
            <dd className="text-sm">
              {formatAbsoluteTime(recoveryCase.createdAt)}
            </dd>
          </div>
          <div className="grid gap-0.5">
            <dt className="text-xs font-medium text-muted-foreground">
              Resolved
            </dt>
            <dd className="text-sm">
              {formatOptionalAbsoluteTime(recoveryCase.resolvedAt)}
            </dd>
          </div>
        </dl>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
        <CaseStepper recoveryCase={recoveryCase} />
        <CaseAuditRail auditTrail={recoveryCase.auditTrail} />
      </div>
    </div>
  );
}
