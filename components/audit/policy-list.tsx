"use client";

import { useQuery } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";

import { PolicyCard } from "@/components/audit/policy-card";
import { EmptyState } from "@/components/data/empty-state";
import { ErrorState } from "@/components/data/error-state";
import { LoadingSkeleton } from "@/components/data/loading-skeleton";
import type { PolicyListResponse } from "@/lib/api/response-types";
import { countLabel } from "@/lib/format/labels";

export function PolicyList() {
  const policiesQuery = useQuery({
    queryKey: ["policies"],
    queryFn: async () => {
      const response = await fetch("/api/policies");

      if (!response.ok) {
        throw new Error(`Policy request failed with status ${response.status}`);
      }

      return (await response.json()) as PolicyListResponse;
    },
    staleTime: 5 * 60 * 1000,
  });

  if (policiesQuery.isPending) {
    return <LoadingSkeleton shape="card-grid" count={6} />;
  }

  if (policiesQuery.isError) {
    return (
      <ErrorState
        heading="Policies could not be loaded"
        message={
          policiesQuery.error instanceof Error
            ? policiesQuery.error.message
            : "The policy request failed."
        }
        onRetry={() => {
          policiesQuery.refetch();
        }}
        isRetrying={policiesQuery.isFetching}
      />
    );
  }

  const policies = policiesQuery.data.items;

  if (policies.length === 0) {
    return (
      <EmptyState
        icon={ShieldCheck}
        heading="No policies are recorded"
        body="The policy table is empty, so the gate currently has no configured cooldowns, caps or thresholds to enforce."
      />
    );
  }

  const enforcedCount = policies.filter((policy) => policy.active).length;

  return (
    <div className="grid gap-4">
      <p className="text-sm text-muted-foreground">
        {countLabel(policies.length, "policy", "policies")} recorded ·{" "}
        {enforcedCount} enforced at evaluation time. These are read-only: the
        gate reads them on every decision and nothing here can be changed from
        the browser.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {policies.map((policy) => (
          <PolicyCard key={policy.id} policy={policy} />
        ))}
      </div>
    </div>
  );
}
