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

const inputClassName =
  "h-10 rounded-xl border border-input bg-background px-3 text-sm transition-colors duration-200 focus:border-brand-indigo focus:outline-none disabled:cursor-not-allowed disabled:opacity-60";

export function SimulatorForm() {
  const searchParams = useSearchParams();
  const [pipeline, setPipeline] = useState<SimulatorPipeline>(
    () =>
      resolveSimulatorPipelineFromSlug(searchParams.get("pipeline")) ??
      "subscription",
  );
  const [customerId, setCustomerId] = useState("");
  const [amountRupees, setAmountRupees] = useState("2499");
  const [itemsSummary, setItemsSummary] = useState("Noise cancelling headphones x1");
  const [errorCode, setErrorCode] = useState<RazorpayErrorCode>("BAD_REQUEST_ERROR");
  const [errorReason, setErrorReason] =
    useState<RazorpayErrorReason>("insufficient_funds");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [runTarget, setRunTarget] = useState<RunTarget | null>(null);
  const [checkoutHandoff, setCheckoutHandoff] =
    useState<RazorpayOrderHandoff | null>(null);
  const [modeNote, setModeNote] = useState<string | null>(null);
  const [runKey, setRunKey] = useState(0);

  const amountPaise = Math.round(Number(amountRupees) * 100);
  const amountIsValid =
    Number.isFinite(amountPaise) && Number.isInteger(amountPaise) && amountPaise >= 100;
  const canSubmit = Boolean(customerId) && amountIsValid && !submitting;

  const submitSimulation = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    setCheckoutHandoff(null);
    setRunTarget(null);
    setModeNote(null);
    setRunKey((previous) => previous + 1);

    const submittedAt = new Date().toISOString();

    try {
      if (pipeline === "payment") {
        const response = await fetch("/api/simulator/payment", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ customerId, amountPaise }),
        });
        const body = await response.json();

        if (!response.ok) {
          throw new Error(body.error ?? "Simulation failed");
        }

        setCheckoutHandoff(body as RazorpayOrderHandoff);
        setRunTarget({ kind: "customer", customerId, since: submittedAt });
        setModeNote(
          "Razorpay will fire the real payment.failed webhook once the payment is declined. Nothing is bypassed.",
        );
      }

      if (pipeline === "checkout") {
        const response = await fetch("/api/simulator/checkout", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ customerId, amountPaise, itemsSummary }),
        });
        const body = await response.json();

        if (!response.ok) {
          throw new Error(body.error ?? "Simulation failed");
        }

        setRunTarget(
          body.caseId
            ? { kind: "case", caseId: body.caseId }
            : { kind: "customer", customerId, since: submittedAt },
        );
        setModeNote(
          `Order ${body.orderId} created and reconciled immediately. Only the 30 minute abandonment threshold was bypassed.`,
        );
      }

      if (pipeline === "subscription") {
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

        setRunTarget(
          body.caseId
            ? { kind: "case", caseId: body.caseId }
            : { kind: "customer", customerId, since: submittedAt },
        );
        setModeNote(
          `Signed webhook ${body.razorpayEventId} posted to the app's own endpoint and answered ${body.webhookStatus}. Signature verification, dedupe and normalization all ran for real.`,
        );
      }
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Simulation failed",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <form
        onSubmit={submitSimulation}
        className="grid gap-5 rounded-xl border border-border p-5"
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
            disabled={submitting}
            onChange={(event) => setAmountRupees(event.target.value)}
            className={inputClassName}
          />
          {!amountIsValid ? (
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

        {submitError ? (
          <p className="rounded-xl border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {submitError}
          </p>
        ) : null}
      </form>

      <div className="grid content-start gap-4">
        {modeNote ? (
          <p className="rounded-xl border border-brand-emerald/40 bg-brand-emerald/5 px-3 py-2 text-xs">
            {modeNote}
          </p>
        ) : null}

        {checkoutHandoff ? (
          <RazorpayCheckoutEmbed handoff={checkoutHandoff} />
        ) : null}

        {pipeline === "payment" ? <TestCardHelper /> : null}

        <RunStatusStrip key={runKey} target={runTarget} />
      </div>
    </div>
  );
}
