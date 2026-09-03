import { Agent } from "@openai/agents";

import type { PipelineContext } from "@/lib/context/build-context";
import { sharedAgentInstructions } from "@/lib/pipelines/shared/agent-instructions";
import { runDiagnosisAgent } from "@/lib/pipelines/shared/run-agent";
import { paymentDegradationOutputSchema, type PaymentDegradationOutput, type PaymentDegradationTrigger } from "@/lib/pipelines/types";

const paymentDegradationInstructions = `${sharedAgentInstructions}

You diagnose a single failed Razorpay payment and propose one recovery action.

Ground your diagnosis in Razorpay's own error semantics:

- An errorReason of "payment_failed" together with an errorSource of "gateway" suggests gateway_timeout.
- An errorReason of "insufficient_funds" maps to insufficient_funds.
- An errorSource of "bank" on an authorization step suggests bank_decline.
- An errorSource of "gateway" or "issuer" whose description mentions risk, fraud or security suggests risk_block.
- Anything the signals do not clearly support is other, reported with lower confidence. Do not guess a specific cause to avoid using other.

Weigh the customer's recent payment history. A customer whose recent payments have otherwise succeeded points toward a transient cause; a repeated identical failure points toward a persistent one. Consider prior recovery attempts on this case before proposing another.`;

const paymentDegradationAgent = new Agent({
  name: "Payment Degradation Diagnosis",
  instructions: paymentDegradationInstructions,
  outputType: paymentDegradationOutputSchema,
  model: "gpt-5",
});

export const diagnosePaymentDegradation = (
  context: PipelineContext<PaymentDegradationTrigger>,
): Promise<PaymentDegradationOutput> =>
  runDiagnosisAgent(paymentDegradationAgent, paymentDegradationOutputSchema, context);
