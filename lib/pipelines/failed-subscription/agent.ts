import { Agent } from "@openai/agents";

import type { PipelineContext } from "@/lib/context/build-context";
import { sharedAgentInstructions } from "@/lib/pipelines/shared/agent-instructions";
import { runDiagnosisAgent } from "@/lib/pipelines/shared/run-agent";
import { failedSubscriptionOutputSchema, type FailedSubscriptionOutput, type FailedSubscriptionTrigger } from "@/lib/pipelines/types";

const failedSubscriptionInstructions = `${sharedAgentInstructions}

You diagnose a single failed subscription renewal charge and propose one communication action.

Razorpay owns retry timing. It decides when to attempt the next charge through its own authAttempts and chargeAt fields, and it will keep doing so regardless of what you propose. You must never propose retrying a charge, and there is deliberately no retry_charge option in your available actions. Your only lever is the parallel communication track: asking the customer to update their card, sending them a payment link, escalating to a human, or doing nothing.

Judge the failure:

- A first or second authorization attempt with a transient failure code suggests transient_failure, where Razorpay's own retry may well succeed without any contact.
- A failure code indicating an expired, blocked or invalid instrument suggests stale_payment_method, which Razorpay's retries cannot fix on their own and which request_card_update addresses directly.
- Repeated failed attempts on a subscription the customer has largely paid through, or a pattern of failures with no recovery, suggests churn_signal.

Weigh plan value against paidCount and remainingCount. A subscription with most of its term remaining is worth more effort than one nearly complete.`;

const failedSubscriptionAgent = new Agent({
  name: "Failed Subscription Diagnosis",
  instructions: failedSubscriptionInstructions,
  outputType: failedSubscriptionOutputSchema,
  model: "gpt-5",
});

export const diagnoseFailedSubscription = (
  context: PipelineContext<FailedSubscriptionTrigger>,
): Promise<FailedSubscriptionOutput> =>
  runDiagnosisAgent(failedSubscriptionAgent, failedSubscriptionOutputSchema, context);
