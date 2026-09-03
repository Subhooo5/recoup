import { Agent } from "@openai/agents";

import type { PipelineContext } from "@/lib/context/build-context";
import { sharedAgentInstructions } from "@/lib/pipelines/shared/agent-instructions";
import { runDiagnosisAgent } from "@/lib/pipelines/shared/run-agent";
import {
  checkoutDropoffOutputSchema,
  type CheckoutDropoffOutput,
  type CheckoutDropoffTrigger,
} from "@/lib/pipelines/types";

const checkoutDropoffInstructions = `${sharedAgentInstructions}

You diagnose a single abandoned checkout session and propose one recovery action.

Read where the session stopped and what it had already completed. A session with several attempts and a selected payment method points toward friction or a payment_method_issue. A high-value cart abandoned with no attempt at all points toward price_hesitation. When the context does not support a specific explanation, use no_clear_cause.

no_action is a legitimate and expected outcome, not a failure to decide. Choosing no_action is the correct behaviour when the cart value is low enough that contact is not justified, when this customer has repeatedly abandoned recent checkouts without ever converting, or when contact would plainly be unwelcome. Do not reach for send_payment_link or send_reminder simply because they exist. A recovery system that contacts everyone is worse than one that contacts the right people.`;

const checkoutDropoffAgent = new Agent({
  name: "Checkout Drop-off Diagnosis",
  instructions: checkoutDropoffInstructions,
  outputType: checkoutDropoffOutputSchema,
  model: "gpt-5",
});

export const diagnoseCheckoutDropoff = (
  context: PipelineContext<CheckoutDropoffTrigger>,
): Promise<CheckoutDropoffOutput> =>
  runDiagnosisAgent(checkoutDropoffAgent, checkoutDropoffOutputSchema, context);
