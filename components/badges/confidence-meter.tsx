"use client";

import { motion } from "motion/react";

import { cn } from "@/lib/utils";

const barTreatment = (confidence: number) => {
  if (confidence < 0.5) {
    return "bg-destructive";
  }

  if (confidence < 0.8) {
    return "bg-brand-indigo";
  }

  return "bg-brand-emerald";
};

type ConfidenceMeterProps = {
  confidence: number;
  label?: string;
  className?: string;
};

export function ConfidenceMeter({
  confidence,
  label = "Agent confidence",
  className,
}: ConfidenceMeterProps) {
  const clamped = Math.min(Math.max(confidence, 0), 1);
  const percentage = Math.round(clamped * 100);

  return (
    <div className={cn("w-full max-w-xs", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="font-mono text-sm font-medium tabular-nums">
          {percentage}%
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted"
      >
        <motion.span
          className={cn("block h-full rounded-full", barTreatment(clamped))}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}
