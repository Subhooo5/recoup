"use client";

import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";

import type { CustomerListResponse } from "@/lib/api/response-types";
import { useCaseFilters } from "@/lib/hooks/use-case-filters";
import {
  CASE_STATUS_VALUES,
  PIPELINE_VALUES,
  caseStatusLabel,
  pipelineLabel,
} from "@/lib/format/labels";

const fieldClassName =
  "h-9 w-full cursor-pointer rounded-xl border border-input bg-background px-3 text-sm transition-colors duration-200 focus:border-brand-indigo focus:outline-none";

export function CaseFilters() {
  const { values, hasActiveFilters, applyChanges, clearFilters } =
    useCaseFilters();

  const customersQuery = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const response = await fetch("/api/customers");

      if (!response.ok) {
        throw new Error(`Customer request failed with status ${response.status}`);
      }

      return (await response.json()) as CustomerListResponse;
    },
  });

  return (
    <div className="rounded-xl border border-border p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <label className="grid gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            Customer
          </span>
          <select
            value={values.customerId}
            disabled={customersQuery.isPending || customersQuery.isError}
            onChange={(event) =>
              applyChanges({ customerId: event.target.value })
            }
            className={fieldClassName}
          >
            <option value="">All customers</option>
            {(customersQuery.data?.items ?? []).map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
          {customersQuery.isError ? (
            <span className="text-xs text-destructive">
              Customers could not be loaded.
            </span>
          ) : null}
        </label>

        <label className="grid gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            Pipeline
          </span>
          <select
            value={values.pipeline}
            onChange={(event) => applyChanges({ pipeline: event.target.value })}
            className={fieldClassName}
          >
            <option value="">All pipelines</option>
            {PIPELINE_VALUES.map((pipeline) => (
              <option key={pipeline} value={pipeline}>
                {pipelineLabel(pipeline)}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            Status
          </span>
          <select
            value={values.status}
            onChange={(event) => applyChanges({ status: event.target.value })}
            className={fieldClassName}
          >
            <option value="">All statuses</option>
            {CASE_STATUS_VALUES.map((status) => (
              <option key={status} value={status}>
                {caseStatusLabel(status)}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            Opened from
          </span>
          <input
            type="date"
            value={values.from}
            max={values.to || undefined}
            onChange={(event) => applyChanges({ from: event.target.value })}
            className={fieldClassName}
          />
        </label>

        <label className="grid gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            Opened to
          </span>
          <input
            type="date"
            value={values.to}
            min={values.from || undefined}
            onChange={(event) => applyChanges({ to: event.target.value })}
            className={fieldClassName}
          />
        </label>
      </div>

      {hasActiveFilters ? (
        <button
          type="button"
          onClick={clearFilters}
          className="mt-3 inline-flex h-8 cursor-pointer items-center gap-1 rounded-md border border-border px-2.5 text-xs font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground"
        >
          <X className="size-3.5" />
          Clear filters
        </button>
      ) : null}
    </div>
  );
}
