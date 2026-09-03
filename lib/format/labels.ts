export const PIPELINE_VALUES = [
  "payment-degradation",
  "checkout-dropoff",
  "failed-subscription",
] as const;

export const CASE_STATUS_VALUES = [
  "open",
  "awaiting_review",
  "resolved",
  "blocked",
  "closed",
] as const;

export const humanizeIdentifier = (value: string) => {
  const spaced = value.replace(/[-_]+/g, " ").trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
};

const buildLookup =
  (entries: Record<string, string>) =>
  (value: string | null | undefined) => {
    if (!value) {
      return "—";
    }

    return entries[value] ?? humanizeIdentifier(value);
  };

export const pipelineLabel = buildLookup({
  "payment-degradation": "Payment Degradation",
  "checkout-dropoff": "Checkout Drop-off",
  "failed-subscription": "Failed Subscription",
  all: "All pipelines",
});

export const caseStatusLabel = buildLookup({
  open: "Open",
  awaiting_review: "Awaiting review",
  resolved: "Resolved",
  blocked: "Blocked",
  closed: "Closed",
});

export const actorLabel = buildLookup({
  system: "System",
  agent: "Agent",
  human: "Human",
});

export const auditActionLabel = buildLookup({
  case_opened: "Case opened",
  context_built: "Context built",
  diagnosis_produced: "Diagnosis produced",
  gate_evaluated: "Policy gate evaluated",
  action_executed: "Action executed",
  action_blocked: "Action blocked",
  action_no_action: "No action taken",
  action_pending_review: "Sent to human review",
  action_failed: "Action failed",
  action_duplicate: "Duplicate action skipped",
  action_recorded: "Action recorded",
  pipeline_error: "Pipeline error",
});

export const actionTypeLabel = buildLookup({
  send_payment_link: "Send payment link",
  retry_alternate_route: "Retry via alternate route",
  send_reminder: "Send reminder",
  request_card_update: "Request card update",
  escalate_human: "Escalate to a human",
  no_action: "No action",
});

export const actionStatusLabel = buildLookup({
  pending: "Pending",
  executed: "Executed",
  completed: "Completed",
  failed: "Failed",
  blocked: "Blocked",
  no_action: "No action",
  pending_review: "Pending review",
  duplicate: "Duplicate",
});

export const diagnosisLabel = buildLookup({
  gateway_timeout: "Gateway timeout",
  insufficient_funds: "Insufficient funds",
  bank_decline: "Bank decline",
  risk_block: "Risk block",
  other: "Other",
  friction: "Checkout friction",
  price_hesitation: "Price hesitation",
  payment_method_issue: "Payment method issue",
  no_clear_cause: "No clear cause",
  transient_failure: "Transient failure",
  stale_payment_method: "Stale payment method",
  churn_signal: "Churn signal",
});

export const gateOutcomeLabel = buildLookup({
  allow: "Allowed",
  block: "Blocked",
  human_review: "Human review",
  no_action: "No action",
});

export const gateCheckLabel = buildLookup({
  action_permitted: "Action permitted",
  no_action_short_circuit: "No-action short circuit",
  subscription_cancelled_stop: "Cancelled subscription stop",
  contact_cooldown: "Contact cooldown",
  action_attempt_cap: "Action attempt cap",
  subscription_retry_ceiling: "Subscription retry ceiling",
  minimum_amount: "Minimum recoverable amount",
  customer_contactable: "Customer contactable",
  confidence_threshold: "Confidence threshold",
});

export const actionOutcomeLabel = buildLookup({
  recovered: "The recovery payment link was paid",
  expired: "The recovery payment link expired before it was paid",
});

export const communicationStatusLabel = buildLookup({
  sent: "Sent",
  failed: "Failed",
});

export const channelLabel = buildLookup({
  email: "Email",
  sms: "SMS",
});

export const ruleTypeLabel = buildLookup({
  cooldown: "Cooldown",
  attempt_cap: "Attempt cap",
  confidence: "Confidence",
  amount: "Amount",
  retry_cap: "Retry cap",
});

export const entityTypeLabel = buildLookup({
  RecoveryCase: "Recovery case",
  PaymentEvent: "Payment event",
  CheckoutSession: "Checkout session",
  Subscription: "Subscription",
});

export const countLabel = (count: number, noun: string, pluralNoun?: string) =>
  `${count} ${count === 1 ? noun : (pluralNoun ?? `${noun}s`)}`;
