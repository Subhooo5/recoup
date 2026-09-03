"use client";

import { RotateCw, TriangleAlert } from "lucide-react";

import { cn } from "@/lib/utils";

type ErrorStateProps = {
  heading?: string;
  message: string;
  onRetry: () => void;
  isRetrying?: boolean;
  className?: string;
};

export function ErrorState({
  heading = "Something went wrong",
  message,
  onRetry,
  isRetrying = false,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-destructive/40 bg-destructive/5 px-6 py-12 text-center",
        className,
      )}
    >
      <span className="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <TriangleAlert className="size-5" />
      </span>
      <h3 className="mt-4 font-heading text-base font-semibold tracking-tight">
        {heading}
      </h3>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        disabled={isRetrying}
        className="mt-5 inline-flex h-9 cursor-pointer items-center gap-2 rounded-xl border border-border bg-background px-3 text-sm font-medium transition-colors duration-200 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
      >
        <RotateCw className={cn("size-4", isRetrying && "animate-spin")} />
        {isRetrying ? "Retrying…" : "Try again"}
      </button>
    </div>
  );
}
