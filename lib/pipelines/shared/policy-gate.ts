import type { PipelineContext } from "@/lib/context/build-context";
import { prisma } from "@/lib/prisma";
import type { FailedSubscriptionTrigger, Pipeline, PipelineTrigger, RecoveryDecision } from "@/lib/pipelines/types";

export type GateCheck = {
  name: string;
  passed: boolean;
  detail: string;
};

export type GateOutcome = "allow" | "block" | "no_action" | "human_review";

export type GateResult = {
  outcome: GateOutcome;
  checks: GateCheck[];
  blockingCheck: string | null;
};

export type EvaluatePolicyGateInput = {
  decision: RecoveryDecision;
  context: PipelineContext<PipelineTrigger>;
  recoveryCaseId: string;
};

const allowedActionsByPipeline: Record<Pipeline, readonly string[]> = {
  "payment-degradation": [
    "send_payment_link",
    "retry_alternate_route",
    "escalate_human",
    "no_action",
  ],
  "checkout-dropoff": ["send_payment_link", "send_reminder", "no_action"],
  "failed-subscription": [
    "request_card_update",
    "send_payment_link",
    "escalate_human",
    "no_action",
  ],
};

const forbiddenActionsByPipeline: Record<Pipeline, readonly string[]> = {
  "payment-degradation": [],
  "checkout-dropoff": [],
  "failed-subscription": ["retry_charge"],
};

const readPolicyNumber = (
  policies: Map<string, unknown>,
  policyName: string,
  configKey: string,
): number | null => {
  const config = policies.get(policyName);

  if (config === null || typeof config !== "object") {
    return null;
  }

  const value = (config as Record<string, unknown>)[configKey];

  return typeof value === "number" ? value : null;
};

const readSubscriptionTrigger = (
  trigger: PipelineTrigger,
): FailedSubscriptionTrigger | null =>
  "razorpaySubscriptionId" in trigger ? trigger : null;

export const evaluatePolicyGate = async ({
  decision,
  context,
  recoveryCaseId,
}: EvaluatePolicyGateInput): Promise<GateResult> => {
  const [activePolicies, existingActionCount, recoveryCase] = await Promise.all([
    prisma.policy.findMany({
      where: { active: true },
      select: { name: true, config: true },
    }),
    prisma.recoveryAction.count({ where: { recoveryCaseId } }),
    prisma.recoveryCase.findUnique({
      where: { id: recoveryCaseId },
      select: { amount: true },
    }),
  ]);

  const policies = new Map<string, unknown>(
    activePolicies.map((policy) => [policy.name, policy.config]),
  );

  const checks: GateCheck[] = [];
  const record = (name: string, passed: boolean, detail: string) => {
    checks.push({ name, passed, detail });
  };

  const isContactAction = decision.proposedAction !== "no_action";
  const subscriptionTrigger =
    decision.pipeline === "failed-subscription"
      ? readSubscriptionTrigger(context.trigger)
      : null;

  const allowedActions = allowedActionsByPipeline[decision.pipeline];
  const forbiddenActions = forbiddenActionsByPipeline[decision.pipeline];

  if (forbiddenActions.includes(decision.proposedAction)) {
    record(
      "action_permitted",
      false,
      `Action "${decision.proposedAction}" is explicitly forbidden for pipeline ${decision.pipeline}`,
    );
  } else if (allowedActions.includes(decision.proposedAction)) {
    record(
      "action_permitted",
      true,
      `Action "${decision.proposedAction}" is permitted for pipeline ${decision.pipeline}`,
    );
  } else {
    record(
      "action_permitted",
      false,
      `Action "${decision.proposedAction}" is not in the allowed set for pipeline ${decision.pipeline}`,
    );
  }

  record(
    "no_action_short_circuit",
    true,
    decision.proposedAction === "no_action"
      ? "The agent proposed no_action. This is the agent's own decision that no recovery is warranted, not a policy violation."
      : `The agent proposed "${decision.proposedAction}" rather than no_action`,
  );

  if (subscriptionTrigger === null) {
    record(
      "subscription_cancelled_stop",
      true,
      "Not applicable outside the failed-subscription pipeline",
    );
  } else if (subscriptionTrigger.status === "cancelled") {
    record(
      "subscription_cancelled_stop",
      false,
      `Subscription ${subscriptionTrigger.razorpaySubscriptionId} is cancelled and must never receive recovery contact`,
    );
  } else {
    record(
      "subscription_cancelled_stop",
      true,
      `Subscription status is "${subscriptionTrigger.status}", not cancelled`,
    );
  }

  const cooldownPolicyHours = readPolicyNumber(
    policies,
    "contact-cooldown-hours",
    "hours",
  );
  const hoursSinceLastContact = context.cooldown.hoursSinceLastContact;

  if (!isContactAction) {
    record(
      "contact_cooldown",
      true,
      "Proposed action does not contact the customer",
    );
  } else if (cooldownPolicyHours === null) {
    record(
      "contact_cooldown",
      true,
      "No active contact-cooldown-hours policy is configured, so no cooldown applies",
    );
  } else if (hoursSinceLastContact === null) {
    record(
      "contact_cooldown",
      true,
      "Customer has no recorded successful contact",
    );
  } else if (hoursSinceLastContact < cooldownPolicyHours) {
    record(
      "contact_cooldown",
      false,
      `Customer was contacted ${hoursSinceLastContact.toFixed(1)} hours ago, inside the ${cooldownPolicyHours} hour cross-pipeline cooldown`,
    );
  } else {
    record(
      "contact_cooldown",
      true,
      `Last contact was ${hoursSinceLastContact.toFixed(1)} hours ago, outside the ${cooldownPolicyHours} hour cooldown`,
    );
  }

  const maxActionsPerCase = readPolicyNumber(
    policies,
    "max-actions-per-case",
    "maxActions",
  );

  if (decision.maxAttempts === 0 && isContactAction) {
    record(
      "action_attempt_cap",
      false,
      `Decision is internally inconsistent: maxAttempts is 0 but proposed action is "${decision.proposedAction}"`,
    );
  } else if (maxActionsPerCase === null) {
    record(
      "action_attempt_cap",
      true,
      "No active max-actions-per-case policy, treating the cap as unset",
    );
  } else if (existingActionCount >= maxActionsPerCase) {
    record(
      "action_attempt_cap",
      false,
      `Case already has ${existingActionCount} recovery actions, at or above the cap of ${maxActionsPerCase}`,
    );
  } else {
    record(
      "action_attempt_cap",
      true,
      `Case has ${existingActionCount} of a maximum ${maxActionsPerCase} recovery actions`,
    );
  }

  const maxAuthAttempts = readPolicyNumber(
    policies,
    "subscription-retry-ceiling",
    "maxAuthAttempts",
  );

  if (subscriptionTrigger === null) {
    record(
      "subscription_retry_ceiling",
      true,
      "Not applicable outside the failed-subscription pipeline",
    );
  } else if (maxAuthAttempts === null) {
    record(
      "subscription_retry_ceiling",
      true,
      "No active subscription-retry-ceiling policy, treating the ceiling as unset",
    );
  } else if (subscriptionTrigger.authAttempts >= maxAuthAttempts) {
    record(
      "subscription_retry_ceiling",
      false,
      `Razorpay reports ${subscriptionTrigger.authAttempts} authorization attempts, at or above the ceiling of ${maxAuthAttempts}`,
    );
  } else {
    record(
      "subscription_retry_ceiling",
      true,
      `Razorpay reports ${subscriptionTrigger.authAttempts} of a maximum ${maxAuthAttempts} authorization attempts`,
    );
  }

  const minimumPaise = readPolicyNumber(
    policies,
    "minimum-recoverable-amount",
    "minimumPaise",
  );
  const caseAmount = recoveryCase?.amount ?? null;

  if (caseAmount === null) {
    record(
      "minimum_amount",
      true,
      "Case has no recorded amount, so the minimum recoverable amount does not apply",
    );
  } else if (minimumPaise === null) {
    record(
      "minimum_amount",
      true,
      "No active minimum-recoverable-amount policy, treating the minimum as unset",
    );
  } else if (caseAmount < minimumPaise) {
    record(
      "minimum_amount",
      false,
      `Case amount of ${caseAmount} paise is below the minimum recoverable amount of ${minimumPaise} paise`,
    );
  } else {
    record(
      "minimum_amount",
      true,
      `Case amount of ${caseAmount} paise meets the minimum of ${minimumPaise} paise`,
    );
  }

  if (context.customer === null) {
    record(
      "customer_contactable",
      false,
      "No customer is associated with this case, so no action can be delivered",
    );
  } else if (!context.customer.email) {
    record(
      "customer_contactable",
      false,
      `Customer ${context.customer.id} has no email address, and every executable action requires an email channel`,
    );
  } else {
    record(
      "customer_contactable",
      true,
      `Customer ${context.customer.id} is reachable by email`,
    );
  }

  const minimumConfidence = readPolicyNumber(
    policies,
    "confidence-auto-execute",
    "minimumConfidence",
  );
  const confidenceBelowThreshold =
    minimumConfidence !== null && decision.confidence < minimumConfidence;

  record(
    "confidence_threshold",
    true,
    minimumConfidence === null
      ? "No active confidence-auto-execute policy, so confidence does not affect routing"
      : confidenceBelowThreshold
        ? `Confidence of ${decision.confidence} is below the auto-execute threshold of ${minimumConfidence}, routing to human review if no rule blocked this decision`
        : `Confidence of ${decision.confidence} meets the auto-execute threshold of ${minimumConfidence}`,
  );

  const firstFailedCheck = checks.find((check) => !check.passed) ?? null;

  const outcome: GateOutcome = firstFailedCheck
    ? "block"
    : decision.proposedAction === "no_action"
      ? "no_action"
      : confidenceBelowThreshold
        ? "human_review"
        : "allow";

  return {
    outcome,
    checks,
    blockingCheck: firstFailedCheck?.name ?? null,
  };
};
