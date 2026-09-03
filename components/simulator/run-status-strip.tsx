"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { CircleCheck, CircleDashed, CircleX, Loader2 } from "lucide-react";

const POLL_INTERVAL_MS = 1500;
const POLL_TIMEOUT_MS = 90000;

const runStages = [
  { action: "case_opened", label: "Case opened" },
  { action: "context_built", label: "Context built" },
  { action: "diagnosis_produced", label: "Diagnosis produced" },
  { action: "gate_evaluated", label: "Gate evaluated" },
  { action: "action_executed", label: "Action executed" },
];

const terminalActions = new Set([
  "action_executed",
  "action_blocked",
  "action_no_action",
  "action_pending_review",
  "action_failed",
  "action_duplicate",
  "pipeline_error",
]);

type LiveEntry = {
  id: string;
  action: string;
  actor: string;
  detail: unknown;
  createdAt: string;
};

export type RunTarget =
  | { kind: "case"; caseId: string }
  | { kind: "customer"; customerId: string; since: string };

type RunStatusStripProps = {
  target: RunTarget | null;
};

const readDetailString = (detail: unknown, key: string) => {
  if (detail === null || typeof detail !== "object") {
    return null;
  }

  const value = (detail as Record<string, unknown>)[key];
  return typeof value === "string" ? value : null;
};

const readDetailNumber = (detail: unknown, key: string) => {
  if (detail === null || typeof detail !== "object") {
    return null;
  }

  const value = (detail as Record<string, unknown>)[key];
  return typeof value === "number" ? value : null;
};

export function RunStatusStrip({ target }: RunStatusStripProps) {
  const [caseId, setCaseId] = useState<string | null>(
    target?.kind === "case" ? target.caseId : null,
  );
  const [entries, setEntries] = useState<LiveEntry[]>([]);
  const [phase, setPhase] = useState<
    "idle" | "waiting" | "running" | "done" | "timeout" | "error"
  >(!target ? "idle" : target.kind === "case" ? "running" : "waiting");
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  useEffect(() => {
    if (!target) {
      return;
    }

    let cancelled = false;
    let timer: number | undefined;
    let activeCaseId = target.kind === "case" ? target.caseId : null;
    const startedAt = Date.now();

    const findCaseForCustomer = async (customerId: string, since: string) => {
      const response = await fetch(
        `/api/cases?customerId=${encodeURIComponent(customerId)}&pageSize=5`,
      );

      if (!response.ok) {
        throw new Error(`Case lookup failed with status ${response.status}`);
      }

      const body = (await response.json()) as {
        items: { id: string; createdAt: string }[];
      };

      const fresh = body.items.find(
        (item) => new Date(item.createdAt).getTime() >= new Date(since).getTime(),
      );

      return fresh?.id ?? null;
    };

    const poll = async () => {
      if (cancelled) {
        return;
      }

      if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
        setPhase("timeout");
        return;
      }

      try {
        if (!activeCaseId && target.kind === "customer") {
          activeCaseId = await findCaseForCustomer(
            target.customerId,
            target.since,
          );

          if (activeCaseId && !cancelled) {
            setCaseId(activeCaseId);
            setPhase("running");
          }
        }

        if (activeCaseId) {
          const response = await fetch(
            `/api/live?caseId=${encodeURIComponent(activeCaseId)}`,
          );

          if (!response.ok) {
            throw new Error(`Live feed failed with status ${response.status}`);
          }

          const body = (await response.json()) as { items: LiveEntry[] };

          if (cancelled) {
            return;
          }

          const ordered = [...body.items].reverse();
          setEntries(ordered);

          if (ordered.some((entry) => terminalActions.has(entry.action))) {
            setPhase("done");
            return;
          }
        }

        timer = window.setTimeout(poll, POLL_INTERVAL_MS);
      } catch (error) {
        if (!cancelled) {
          setPhase("error");
          setErrorDetail(
            error instanceof Error ? error.message : "Polling failed",
          );
        }
      }
    };

    poll();

    return () => {
      cancelled = true;

      if (timer) {
        window.clearTimeout(timer);
      }
    };
  }, [target]);

  const diagnosisEntry = entries.find(
    (entry) => entry.action === "diagnosis_produced",
  );
  const gateEntry = entries.find((entry) => entry.action === "gate_evaluated");
  const actionEntry = entries.find((entry) =>
    entry.action.startsWith("action_"),
  );

  const stageState = useMemo(() => {
    const seen = new Set(entries.map((entry) => entry.action));

    return runStages.map((stage) => {
      if (stage.action === "action_executed") {
        const finalEntry = entries.find((entry) =>
          entry.action.startsWith("action_"),
        );

        return {
          ...stage,
          label: finalEntry
            ? finalEntry.action.replace("action_", "Action ").replace(/_/g, " ")
            : stage.label,
          reached: Boolean(finalEntry),
          failed: finalEntry?.action === "action_failed",
        };
      }

      return { ...stage, reached: seen.has(stage.action), failed: false };
    });
  }, [entries]);

  if (!target) {
    return (
      <div className="rounded-xl border border-dashed border-border p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Run a simulation to watch the pipeline execute here.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-heading text-sm font-semibold">Pipeline run</h3>
        {phase === "waiting" || phase === "running" ? (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" />
            {phase === "waiting" ? "Waiting for Razorpay" : "Running"}
          </span>
        ) : null}
      </div>

      {phase === "waiting" ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Complete the payment in Checkout. This waits for Razorpay to deliver
          the webhook that opens the case.
        </p>
      ) : null}

      <ol className="mt-4 grid gap-2">
        <AnimatePresence initial={false}>
          {stageState.map((stage, index) => (
            <motion.li
              key={stage.action}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.25,
                delay: index * 0.04,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="flex items-center gap-2.5 text-sm"
            >
              {stage.failed ? (
                <CircleX className="size-4 shrink-0 text-destructive" />
              ) : stage.reached ? (
                <CircleCheck className="size-4 shrink-0 text-brand-emerald" />
              ) : (
                <CircleDashed className="size-4 shrink-0 text-muted-foreground/50" />
              )}
              <span
                className={
                  stage.reached ? "capitalize" : "capitalize text-muted-foreground"
                }
              >
                {stage.label}
              </span>
            </motion.li>
          ))}
        </AnimatePresence>
      </ol>

      {diagnosisEntry || gateEntry || actionEntry ? (
        <dl className="mt-4 grid gap-2 border-t border-border pt-3 text-xs">
          {diagnosisEntry ? (
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Diagnosis</dt>
              <dd className="text-right font-medium">
                {readDetailString(diagnosisEntry.detail, "diagnosis") ?? "—"}
                {readDetailNumber(diagnosisEntry.detail, "confidence") !== null
                  ? ` · ${readDetailNumber(diagnosisEntry.detail, "confidence")}`
                  : ""}
              </dd>
            </div>
          ) : null}

          {gateEntry ? (
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Gate</dt>
              <dd className="text-right font-medium">
                {readDetailString(gateEntry.detail, "outcome") ?? "—"}
                {readDetailString(gateEntry.detail, "blockingCheck")
                  ? ` · ${readDetailString(gateEntry.detail, "blockingCheck")}`
                  : ""}
              </dd>
            </div>
          ) : null}

          {actionEntry ? (
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Action</dt>
              <dd className="text-right font-medium">
                {readDetailString(actionEntry.detail, "actionType") ?? "—"}
                {readDetailString(actionEntry.detail, "status")
                  ? ` · ${readDetailString(actionEntry.detail, "status")}`
                  : ""}
              </dd>
            </div>
          ) : null}
        </dl>
      ) : null}

      {phase === "timeout" ? (
        <p className="mt-3 rounded-xl border border-border px-3 py-2 text-xs text-muted-foreground">
          Stopped watching after 90 seconds. Nothing further arrived — the run
          may still complete, so check the case list.
        </p>
      ) : null}

      {phase === "error" ? (
        <p className="mt-3 rounded-xl border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {errorDetail}
        </p>
      ) : null}

      {caseId ? (
        <Link
          href={`/cases/${caseId}`}
          className="mt-4 inline-flex cursor-pointer text-xs font-medium text-brand-indigo transition-opacity duration-200 hover:opacity-80"
        >
          Open case detail →
        </Link>
      ) : null}
    </div>
  );
}
