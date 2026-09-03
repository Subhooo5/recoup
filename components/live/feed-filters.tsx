"use client";

import { X } from "lucide-react";

import {
  actorLabel,
  auditActionLabel,
  pipelineLabel,
} from "@/lib/format/labels";

export type FeedFilterValues = {
  pipeline: string;
  actor: string;
  action: string;
};

type FeedFiltersProps = {
  values: FeedFilterValues;
  pipelineOptions: string[];
  actorOptions: string[];
  actionOptions: string[];
  onChange: (values: FeedFilterValues) => void;
};

const selectClassName =
  "h-8 cursor-pointer rounded-md border border-input bg-background px-2 text-xs transition-colors duration-200 focus:border-brand-indigo focus:outline-none";

export function FeedFilters({
  values,
  pipelineOptions,
  actorOptions,
  actionOptions,
  onChange,
}: FeedFiltersProps) {
  const hasActiveFilter = Boolean(
    values.pipeline || values.actor || values.action,
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        aria-label="Filter by pipeline"
        value={values.pipeline}
        onChange={(event) =>
          onChange({ ...values, pipeline: event.target.value })
        }
        className={selectClassName}
      >
        <option value="">All pipelines</option>
        {pipelineOptions.map((pipeline) => (
          <option key={pipeline} value={pipeline}>
            {pipelineLabel(pipeline)}
          </option>
        ))}
      </select>

      <select
        aria-label="Filter by actor"
        value={values.actor}
        onChange={(event) => onChange({ ...values, actor: event.target.value })}
        className={selectClassName}
      >
        <option value="">All actors</option>
        {actorOptions.map((actor) => (
          <option key={actor} value={actor}>
            {actorLabel(actor)}
          </option>
        ))}
      </select>

      <select
        aria-label="Filter by action type"
        value={values.action}
        onChange={(event) => onChange({ ...values, action: event.target.value })}
        className={selectClassName}
      >
        <option value="">All actions</option>
        {actionOptions.map((action) => (
          <option key={action} value={action}>
            {auditActionLabel(action)}
          </option>
        ))}
      </select>

      {hasActiveFilter ? (
        <button
          type="button"
          onClick={() => onChange({ pipeline: "", actor: "", action: "" })}
          className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-md border border-border px-2 text-xs text-muted-foreground transition-colors duration-200 hover:text-foreground"
        >
          <X className="size-3" />
          Clear
        </button>
      ) : null}
    </div>
  );
}
