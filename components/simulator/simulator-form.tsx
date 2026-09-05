"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "motion/react";

import {
  CustomerPicker,
} from "@/components/simulator/customer-picker";
import {
  PipelineSelect,
  resolveSimulatorPipelineFromSlug,
  simulatorPipelines,
  type SimulatorPipeline,
} from "@/components/simulator/pipeline-select";
import {
  ReasonCodeSelect,
  type RazorpayErrorCode,
  type RazorpayErrorReason,
} from "@/components/simulator/reason-code-select";
import {
  RazorpayCheckoutEmbed,
  type RazorpayOrderHandoff,
} from "@/components/simulator/razorpay-checkout-embed";
import {
  RunStatusStrip,
  type RunTarget,
} from "@/components/simulator/run-status-strip";
import { TestCardHelper } from "@/components/simulator/test-card-helper";
import { cn } from "@/lib/utils";

const inputClassName =
  "h-10 rounded-xl border border-input bg-background px-3 text-sm transition-colors duration-200 focus:border-brand-indigo focus:outline-none disabled:cursor-not-allowed disabled:opacity-60";

type PipelineRunState = {
  runTarget: RunTarget | null;
  checkoutHandoff: RazorpayOrderHandoff | null;
  modeNote: string | null;
  submitError: string | null;
  runKey: number;
};

const emptyRunState: PipelineRunState = {
  runTarget: null,
  checkoutHandoff: null,
  modeNote: null,
  submitError: null,
  runKey: 0,
};

const amountPlaceholders: Record<SimulatorPipeline, string> = {
  payment: "e.g. 24999",
  checkout: "e.g. 45900",
  subscription: "e.g. 199",
};

const initialRunStates: Record<SimulatorPipeline, PipelineRunState> = {
  payment: emptyRunState,
  checkout: emptyRunState,
  subscription: emptyRunState,
};

export function SimulatorForm() {
  const searchParams = useSearchParams();
  const [pipeline, setPipeline] = useState<SimulatorPipeline>(
    () =>
      resolveSimulatorPipelineFromSlug(searchParams.get("pipeline")) ??
      "subscription",
  );
  const [customerId, setCustomerId] = useState("");
  const [amountRupees, setAmountRupees] = useState("");
  const [itemsSummary, setItemsSummary] = useState("");
  const [errorCode, setErrorCode] = useState<RazorpayErrorCode>("BAD_REQUEST_ERROR");
  const [errorReason, setErrorReason] =
    useState<RazorpayErrorReason>("insufficient_funds");

  const [submitting, setSubmitting] = useState(false);
  const [runStates, setRunStates] =
    useState<Record<SimulatorPipeline, PipelineRunState>>(initialRunStates);

  const activeRunState = runStates[pipeline];

  const updateRunState = (
    targetPipeline: SimulatorPipeline,
    changes: Partial<PipelineRunState>,
  ) =>
    setRunStates((previous) => ({
      ...previous,
      [targetPipeline]: { ...previous[targetPipeline], ...changes },
    }));

  const amountPaise = Math.round(Number(amountRupees) * 100);
  const amountIsValid =
    Number.isFinite(amountPaise) && Number.isInteger(amountPaise) && amountPaise >= 100;
  const itemsSummaryIsValid =
    pipeline !== "checkout" || itemsSummary.trim().length > 0;
  const canSubmit =
    Boolean(customerId) && amountIsValid && itemsSummaryIsValid && !submitting;

  const submitSimulation = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    const submittedPipeline = pipeline;

    setSubmitting(true);
    updateRunState(submittedPipeline, {
      submitError: null,
      checkoutHandoff: null,
      runTarget: null,
      modeNote: null,
      runKey: runStates[submittedPipeline].runKey + 1,
    });

    const submittedAt = new Date().toISOString();

    try {
      if (submittedPipeline === "payment") {
        const response = await fetch("/api/simulator/payment", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ customerId, amountPaise }),
        });
        const body = await response.json();

        if (!response.ok) {
          throw new Error(body.error ?? "Simulation failed");
        }

        updateRunState(submittedPipeline, {
          checkoutHandoff: body as RazorpayOrderHandoff,
          runTarget: { kind: "customer", customerId, since: submittedAt },
          modeNote:
            "Razorpay will fire the real payment.failed webhook once the payment is declined. Nothing is bypassed.",
        });
      }

      if (submittedPipeline === "checkout") {
        const response = await fetch("/api/simulator/checkout", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ customerId, amountPaise, itemsSummary }),
        });
        const body = await response.json();

        if (!response.ok) {
          throw new Error(body.error ?? "Simulation failed");
        }

        updateRunState(submittedPipeline, {
          runTarget: body.caseId
            ? { kind: "case", caseId: body.caseId }
            : { kind: "customer", customerId, since: submittedAt },
          modeNote: `Order ${body.orderId} created and reconciled immediately. Only the 30 minute abandonment threshold was bypassed.`,
        });
      }

      if (submittedPipeline === "subscription") {
        const response = await fetch("/api/simulator/subscription", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            customerId,
            planAmountPaise: amountPaise,
            errorCode,
            errorReason,
            event: "subscription.halted",
          }),
        });
        const body = await response.json();

        if (!response.ok) {
          throw new Error(body.error ?? "Simulation failed");
        }

        updateRunState(submittedPipeline, {
          runTarget: body.caseId
            ? { kind: "case", caseId: body.caseId }
            : { kind: "customer", customerId, since: submittedAt },
          modeNote: `Signed webhook ${body.razorpayEventId} posted to the app's own endpoint and answered ${body.webhookStatus}. Signature verification, dedupe and normalization all ran for real.`,
        });
      }
    } catch (error) {
      updateRunState(submittedPipeline, {
        submitError:
          error instanceof Error ? error.message : "Simulation failed",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
      <form
        onSubmit={submitSimulation}
        className="grid content-start gap-5 rounded-xl border border-border p-5"
      >
        <PipelineSelect
          value={pipeline}
          onChange={setPipeline}
          disabled={submitting}
        />

        <CustomerPicker
          value={customerId}
          onChange={setCustomerId}
          disabled={submitting}
        />

        <label className="grid gap-2">
          <span className="text-sm font-medium">
            {pipeline === "subscription" ? "Plan amount" : "Amount"} in rupees
          </span>
          <input
            type="number"
            min="1"
            step="0.01"
            value={amountRupees}
            placeholder={amountPlaceholders[pipeline]}
            disabled={submitting}
            onChange={(event) => setAmountRupees(event.target.value)}
            className={inputClassName}
          />
          {amountRupees !== "" && !amountIsValid ? (
            <span className="text-xs text-destructive">
              Enter an amount of at least ₹1.00.
            </span>
          ) : null}
        </label>

        {pipeline === "checkout" ? (
          <label className="grid gap-2">
            <span className="text-sm font-medium">Items summary</span>
            <input
              type="text"
              value={itemsSummary}
              placeholder="e.g. Wireless headphones x1"
              disabled={submitting}
              onChange={(event) => setItemsSummary(event.target.value)}
              className={inputClassName}
            />
          </label>
        ) : null}

        {pipeline === "payment" || pipeline === "subscription" ? (
          <ReasonCodeSelect
            errorCode={errorCode}
            errorReason={errorReason}
            onErrorCodeChange={setErrorCode}
            onErrorReasonChange={setErrorReason}
            disabled={submitting}
          />
        ) : null}

        {pipeline === "payment" ? (
          <p className="rounded-xl border border-border px-3 py-2 text-xs text-muted-foreground">
            Razorpay decides the real error code for a declined test card, so the
            codes above describe what you expect rather than forcing it.
          </p>
        ) : null}

        <motion.button
          type="submit"
          disabled={!canSubmit}
          whileHover={canSubmit ? { scale: 1.02 } : undefined}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="h-10 cursor-pointer rounded-xl bg-foreground px-4 text-sm font-medium text-background transition-opacity duration-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gradient-to-r dark:from-brand-indigo dark:to-brand-emerald dark:text-white"
        >
          {submitting ? "Running…" : "Run simulation"}
        </motion.button>

        {activeRunState.submitError ? (
          <p className="rounded-xl border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {activeRunState.submitError}
          </p>
        ) : null}
      </form>

      <div className="grid content-start gap-4">
        {simulatorPipelines.map(({ value }) => {
          const runState = runStates[value];

          return (
            <div
              key={value}
              className={cn(
                "grid content-start gap-4",
                value === pipeline ? undefined : "hidden",
              )}
            >
              {runState.modeNote ? (
                <p className="rounded-xl border border-brand-emerald/40 bg-brand-emerald/5 px-3 py-2 text-xs">
                  {runState.modeNote}
                </p>
              ) : null}

              {runState.checkoutHandoff ? (
                <RazorpayCheckoutEmbed handoff={runState.checkoutHandoff} />
              ) : null}

              {value === "payment" ? <TestCardHelper /> : null}

              <RunStatusStrip
                key={runState.runKey}
                target={runState.runTarget}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
