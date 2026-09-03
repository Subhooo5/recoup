"use client";

import { X } from "lucide-react";

import { ActorBadge } from "@/components/badges/actor-badge";
import {
  auditActionLabel,
  entityTypeLabel,
} from "@/lib/format/labels";
import { useAuditFilters } from "@/lib/hooks/use-audit-filters";
import { useAuditVocabulary } from "@/lib/hooks/use-audit-vocabulary";
import { cn } from "@/lib/utils";

const fieldClassName =
  "h-9 w-full cursor-pointer rounded-xl border border-input bg-background px-3 text-sm transition-colors duration-200 focus:border-brand-indigo focus:outline-none";

const actorOptions = ["system", "agent", "human"];

export function AuditFilters() {
  const { values, hasActiveFilters, applyChanges, clearFilters } =
    useAuditFilters();
  const { actions, entityTypes } = useAuditVocabulary();

  const actionOptions = [...actions].sort((first, second) =>
    auditActionLabel(first).localeCompare(auditActionLabel(second)),
  );

  return (
    <div className="rounded-xl border border-border p-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <div className="grid gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            Actor
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => applyChanges({ actor: "" })}
              className={cn(
                "cursor-pointer rounded-md border px-2 py-0.5 text-xs font-medium transition-colors duration-200",
                values.actor === ""
                  ? "border-foreground/40 bg-foreground/5 text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              All actors
            </button>
            {actorOptions.map((actor) => (
              <button
                key={actor}
                type="button"
                aria-pressed={values.actor === actor}
                onClick={() =>
                  applyChanges({ actor: values.actor === actor ? "" : actor })
                }
                className={cn(
                  "cursor-pointer rounded-md p-0.5 transition-all duration-200",
                  values.actor === actor
                    ? "ring-2 ring-brand-indigo/60"
                    : "opacity-65 hover:opacity-100",
                )}
              >
                <ActorBadge actor={actor} />
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="grid gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Entity type
            </span>
            <select
              value={values.entityType}
              onChange={(event) =>
                applyChanges({ entityType: event.target.value })
              }
              className={fieldClassName}
            >
              <option value="">All entities</option>
              {entityTypes.map((entityType) => (
                <option key={entityType} value={entityType}>
                  {entityTypeLabel(entityType)}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Action
            </span>
            <select
              value={values.action}
              onChange={(event) => applyChanges({ action: event.target.value })}
              className={fieldClassName}
            >
              <option value="">All actions</option>
              {actionOptions.map((action) => (
                <option key={action} value={action}>
                  {auditActionLabel(action)}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Recorded from
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
              Recorded to
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
