"use client";

import { motion } from "motion/react";

import { PIPELINE_VALUES } from "@/lib/format/labels";
import { cn } from "@/lib/utils";

export type SimulatorPipeline = "payment" | "checkout" | "subscription";

export type SimulatorPipelineSlug = (typeof PIPELINE_VALUES)[number];

export const simulatorPipelines: {
  value: SimulatorPipeline;
  slug: SimulatorPipelineSlug;
  label: string;
  mode: string;
  description: string;
}[] = [
  {
    value: "payment",
    slug: "payment-degradation",
    label: "Payment Degradation",
    mode: "Mode A",
    description:
      "Creates a real Razorpay order and opens Checkout. Razorpay fires the real payment.failed webhook.",
  },
  {
    value: "checkout",
    slug: "checkout-dropoff",
    label: "Checkout Drop-off",
    mode: "Mode B",
    description:
      "Creates a real order, then runs reconciliation immediately instead of waiting 30 minutes.",
  },
  {
    value: "subscription",
    slug: "failed-subscription",
    label: "Failed Subscription",
    mode: "Mode C",
    description:
      "Signs a real webhook payload and posts it to this app's own webhook endpoint over HTTP.",
  },
];

export const resolveSimulatorPipelineFromSlug = (
  slug: string | null,
): SimulatorPipeline | null =>
  simulatorPipelines.find((pipeline) => pipeline.slug === slug)?.value ?? null;

type PipelineSelectProps = {
  value: SimulatorPipeline;
  onChange: (value: SimulatorPipeline) => void;
  disabled: boolean;
};

export function PipelineSelect({
  value,
  onChange,
  disabled,
}: PipelineSelectProps) {
  return (
    <div className="grid gap-2">
      <span className="text-sm font-medium">Pipeline</span>
      <div className="grid gap-2 sm:grid-cols-3">
        {simulatorPipelines.map((pipeline) => {
          const isActive = pipeline.value === value;

          return (
            <button
              key={pipeline.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(pipeline.value)}
              className={cn(
                "relative cursor-pointer rounded-xl border p-3 text-left transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60",
                isActive
                  ? "border-brand-indigo/60 bg-brand-indigo/5"
                  : "border-border hover:border-brand-indigo/40",
              )}
            >
              {isActive ? (
                <motion.span
                  layoutId="simulator-pipeline-active"
                  className="absolute inset-0 rounded-xl ring-1 ring-brand-indigo/50"
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                />
              ) : null}
              <span className="relative block text-xs font-medium text-brand-indigo">
                {pipeline.mode}
              </span>
              <span className="relative mt-1 block text-sm font-medium">
                {pipeline.label}
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        {simulatorPipelines.find((pipeline) => pipeline.value === value)
          ?.description}
      </p>
    </div>
  );
}
