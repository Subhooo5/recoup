"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";

import { PipelineBadge } from "@/components/badges/pipeline-badge";
import { ErrorState } from "@/components/data/error-state";
import { LoadingSkeleton } from "@/components/data/loading-skeleton";
import type {
  MetricsOverviewResponse,
  MetricsPipelineFunnel,
} from "@/lib/api/response-types";
import { formatRupees } from "@/lib/format/currency";
import { countLabel, diagnosisLabel } from "@/lib/format/labels";
import { cn } from "@/lib/utils";

const revealTransition = { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const };

const funnelStages = [
  { key: "detected", label: "Detected" },
  { key: "diagnosed", label: "Diagnosed" },
  { key: "allowed", label: "Allowed" },
  { key: "executed", label: "Executed" },
  { key: "recovered", label: "Recovered" },
] as const;

type StatTileProps = {
  label: string;
  value: string;
  caption: string;
};

function StatTile({ label, value, caption }: StatTileProps) {
  return (
    <div className="rounded-xl border border-border p-5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 font-heading text-2xl font-semibold tracking-tight tabular-nums">
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{caption}</p>
    </div>
  );
}

function PipelineFunnel({ funnel }: { funnel: MetricsPipelineFunnel }) {
  return (
    <ol className="grid gap-2">
      {funnelStages.map(({ key, label }) => {
        const value = funnel[key];
        const share =
          funnel.detected === 0 ? 0 : (value / funnel.detected) * 100;

        return (
          <li key={key} className="grid gap-1">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-xs text-muted-foreground">{label}</span>
              <span className="font-mono text-xs tabular-nums">{value}</span>
            </div>
            <span className="block h-1 w-full overflow-hidden rounded-full bg-muted">
              <span
                className={cn(
                  "block h-full rounded-full",
                  key === "recovered" ? "bg-brand-emerald" : "bg-brand-indigo",
                )}
                style={{ width: `${share}%` }}
              />
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function RecoveryMetrics() {
  const metricsQuery = useQuery({
    queryKey: ["metrics-overview"],
    queryFn: async () => {
      const response = await fetch("/api/metrics/overview");

      if (!response.ok) {
        throw new Error(`Metrics request failed with status ${response.status}`);
      }

      return (await response.json()) as MetricsOverviewResponse;
    },
  });

  return (
    <section className="mx-auto w-full max-w-6xl px-6 pb-28">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={revealTransition}
        className="mx-auto max-w-2xl text-center"
      >
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Measured, not claimed
        </h2>
        <p className="mt-4 text-muted-foreground text-pretty">
          Every number below is counted live from the recovery ledger on each
          request. Nothing here is a sample or a projection.
        </p>
      </motion.div>

      <div className="mt-14">
        {metricsQuery.isPending ? (
          <LoadingSkeleton shape="card-grid" count={3} />
        ) : null}

        {metricsQuery.isError ? (
          <ErrorState
            heading="Metrics could not be loaded"
            message={
              metricsQuery.error instanceof Error
                ? metricsQuery.error.message
                : "The metrics request failed."
            }
            onRetry={() => {
              metricsQuery.refetch();
            }}
            isRetrying={metricsQuery.isFetching}
          />
        ) : null}

        {metricsQuery.data ? (
          <div className="grid gap-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-brand-emerald/35 bg-brand-emerald/5 p-5 sm:col-span-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Recovered so far
                </p>
                <p className="mt-2 font-heading text-4xl font-semibold tracking-tight text-brand-emerald-readable tabular-nums">
                  {formatRupees(metricsQuery.data.totals.amountRecovered)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Attributed back to its case when a recovery payment link is
                  paid
                </p>
              </div>

              <StatTile
                label="At risk"
                value={formatRupees(metricsQuery.data.totals.amountAtRisk)}
                caption={countLabel(
                  metricsQuery.data.totals.casesOpened,
                  "case",
                )}
              />

              <StatTile
                label="Recovery rate"
                value={`${metricsQuery.data.totals.recoveryRatePercent}%`}
                caption={`${metricsQuery.data.totals.actionsExecuted} executed · ${metricsQuery.data.totals.actionsBlocked} stopped by the gate`}
              />
            </div>

            {metricsQuery.data.totals.casesOpened === 0 ? (
              <div className="rounded-xl border border-dashed border-border px-6 py-10 text-center">
                <p className="text-sm text-muted-foreground">
                  No pipeline has run yet, so every count above is a genuine
                  zero rather than a placeholder.
                </p>
                <Link
                  href="/simulator"
                  className="mt-4 inline-flex h-9 cursor-pointer items-center rounded-xl bg-foreground px-4 text-sm font-medium text-background transition-opacity duration-200 hover:opacity-90 dark:bg-gradient-to-r dark:from-brand-indigo dark:to-brand-emerald dark:text-white"
                >
                  Open the Simulator
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-3">
                {metricsQuery.data.byPipeline.map((breakdown) => {
                  const funnel = metricsQuery.data.funnel.find(
                    (entry) => entry.pipeline === breakdown.pipeline,
                  );

                  return (
                    <div
                      key={breakdown.pipeline}
                      className="grid content-start gap-4 rounded-xl border border-border p-5"
                    >
                      <PipelineBadge
                        pipeline={breakdown.pipeline}
                        className="w-fit"
                      />

                      <dl className="grid gap-2 text-sm">
                        <div className="flex items-baseline justify-between gap-3">
                          <dt className="text-xs text-muted-foreground">
                            At risk
                          </dt>
                          <dd className="font-mono text-xs tabular-nums">
                            {formatRupees(breakdown.amountAtRisk)}
                          </dd>
                        </div>
                        <div className="flex items-baseline justify-between gap-3">
                          <dt className="text-xs text-muted-foreground">
                            Recovered
                          </dt>
                          <dd className="font-mono text-xs text-brand-emerald-readable tabular-nums">
                            {formatRupees(breakdown.amountRecovered)}
                          </dd>
                        </div>
                        <div className="flex items-baseline justify-between gap-3">
                          <dt className="text-xs text-muted-foreground">
                            Top diagnosis
                          </dt>
                          <dd className="text-xs">
                            {breakdown.topDiagnosis === null
                              ? "—"
                              : diagnosisLabel(breakdown.topDiagnosis)}
                          </dd>
                        </div>
                      </dl>

                      {funnel ? (
                        <div className="border-t border-border pt-3">
                          <PipelineFunnel funnel={funnel} />
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}
