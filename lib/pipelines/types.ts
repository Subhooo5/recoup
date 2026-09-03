import { z } from "zod";

import type { GateOutcome } from "@/lib/pipelines/shared/policy-gate";

export const PIPELINES = [
  "payment-degradation",
  "checkout-dropoff",
  "failed-subscription",
] as const;

export type Pipeline = (typeof PIPELINES)[number];

export type PaymentDegradationTrigger = {
  razorpayPaymentId: string;
  amount: number;
  currency: string;
  method: string | null;
  errorCode: string | null;
  errorDescription: string | null;
  errorReason: string | null;
  errorSource: string | null;
  errorStep: string | null;
};

export type CheckoutDropoffTrigger = {
  razorpayOrderId: string;
  amount: number;
  amountDue: number;
  attempts: number;
  cartValue: number | null;
  itemsSummary: string | null;
  paymentMethodSelected: string | null;
  abandonedAt: Date | null;
};

export type FailedSubscriptionTrigger = {
  razorpaySubscriptionId: string;
  planId: string;
  status: string;
  authAttempts: number;
  chargeAt: Date | null;
  paidCount: number | null;
  remainingCount: number | null;
  lastFailureCode: string | null;
  lastFailureReason: string | null;
};

export type PipelineTrigger =
  | PaymentDegradationTrigger
  | CheckoutDropoffTrigger
  | FailedSubscriptionTrigger;

const createDiagnosisOutputSchema = <
  TDiagnosis extends readonly [string, ...string[]],
  TProposedAction extends readonly [string, ...string[]],
>(definition: {
  diagnosisValues: TDiagnosis;
  diagnosisDescription: string;
  proposedActionValues: TProposedAction;
  proposedActionDescription: string;
}) =>
  z.object({
    diagnosis: z
      .enum(definition.diagnosisValues)
      .describe(definition.diagnosisDescription),
    evidence: z
      .array(z.string())
      .max(4)
      .describe(
        "Up to four short factual observations taken directly from the supplied context. Each entry must be a concrete detail present in the context, such as a specific error reason, amount, status or count. Do not restate your diagnosis and do not include facts the context does not contain.",
      ),
    confidence: z
      .number()
      .min(0)
      .max(1)
      .describe(
        "Your genuine certainty in the diagnosis, between 0 and 1. Report real uncertainty honestly. A low score paired with an honest catch-all diagnosis is better than a high score on a guess. Confidence never relaxes any downstream rule.",
      ),
    proposedAction: z
      .enum(definition.proposedActionValues)
      .describe(definition.proposedActionDescription),
    reason: z
      .string()
      .describe(
        "One sentence justifying the proposed action, grounded in the evidence entries you listed.",
      ),
    maxAttempts: z
      .number()
      .int()
      .min(0)
      .max(3)
      .describe(
        "The total number of times this action may be attempted, between 0 and 3. Use 0 when proposing no action.",
      ),
  });

export const paymentDegradationOutputSchema = createDiagnosisOutputSchema({
  diagnosisValues: [
    "gateway_timeout",
    "insufficient_funds",
    "bank_decline",
    "risk_block",
    "other",
  ] as const,
  diagnosisDescription:
    "The most likely cause of this payment failure, judged from the Razorpay error fields and the customer's payment history. Use other when the signals do not clearly support one of the specific causes.",
  proposedActionValues: [
    "send_payment_link",
    "retry_alternate_route",
    "escalate_human",
    "no_action",
  ] as const,
  proposedActionDescription:
    "The single recovery action you propose. A deterministic policy gate decides whether it actually runs.",
});

export const checkoutDropoffOutputSchema = createDiagnosisOutputSchema({
  diagnosisValues: [
    "friction",
    "price_hesitation",
    "payment_method_issue",
    "no_clear_cause",
  ] as const,
  diagnosisDescription:
    "The most likely reason this checkout was not completed, judged from cart value, items, selected payment method and the customer's prior checkout behaviour. Use no_clear_cause when the context does not support a specific explanation.",
  proposedActionValues: [
    "send_payment_link",
    "send_reminder",
    "no_action",
  ] as const,
  proposedActionDescription:
    "The single recovery action you propose. no_action is a legitimate and expected choice, not a failure to decide. A deterministic policy gate decides whether the action actually runs.",
});

export const failedSubscriptionOutputSchema = createDiagnosisOutputSchema({
  diagnosisValues: [
    "transient_failure",
    "stale_payment_method",
    "churn_signal",
  ] as const,
  diagnosisDescription:
    "The most likely reason this subscription charge failed, judged from the failure code and reason, the number of authorization attempts, and how much of the plan the customer has already paid.",
  proposedActionValues: [
    "request_card_update",
    "send_payment_link",
    "escalate_human",
    "no_action",
  ] as const,
  proposedActionDescription:
    "The single communication action you propose. Retrying the charge is deliberately not an option because Razorpay owns retry timing. A deterministic policy gate decides whether the action actually runs.",
});

export type PaymentDegradationOutput = z.infer<
  typeof paymentDegradationOutputSchema
>;

export type CheckoutDropoffOutput = z.infer<typeof checkoutDropoffOutputSchema>;

export type FailedSubscriptionOutput = z.infer<
  typeof failedSubscriptionOutputSchema
>;


export type AgentDiagnosisOutput =
  | PaymentDegradationOutput
  | CheckoutDropoffOutput
  | FailedSubscriptionOutput;

export type RecoveryDecision = {
  pipeline: Pipeline;
  diagnosis: string;
  evidence: string[];
  confidence: number;
  proposedAction: string;
  reason: string;
  maxAttempts: number;
};

export const normalizeDecision = (
  pipeline: Pipeline,
  agentOutput: AgentDiagnosisOutput,
): RecoveryDecision => ({
  pipeline,
  diagnosis: agentOutput.diagnosis,
  evidence: [...agentOutput.evidence],
  confidence: agentOutput.confidence,
  proposedAction: agentOutput.proposedAction,
  reason: agentOutput.reason,
  maxAttempts: agentOutput.maxAttempts,
});

export type PipelineRunResult = {
  ran: boolean;
  reason: string | null;
  recoveryCaseId: string | null;
  caseStatus: string | null;
  diagnosis: string | null;
  confidence: number | null;
  proposedAction: string | null;
  gateOutcome: GateOutcome | null;
  blockingCheck: string | null;
  actionStatus: string | null;
  duplicate: boolean;
  caseStatusNote: string | null;
  detail: string | null;
};
