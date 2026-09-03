import { z } from "zod";

import { jsonResponse } from "@/lib/api/serialize";
import {
  createSimulatedOrder,
  simulatorAmountSchema,
} from "@/lib/api/simulator-orders";
import { reconcileCheckoutSession } from "@/lib/reconciliation/reconcile-checkouts";

export const runtime = "nodejs";

const checkoutSimulationSchema = z.object({
  customerId: z.string().min(1),
  amountPaise: simulatorAmountSchema,
  itemsSummary: z.string().min(1).max(500),
});

export async function POST(request: Request) {
  let requestBody: unknown;

  try {
    requestBody = await request.json();
  } catch {
    return jsonResponse({ error: "Request body must be valid JSON" }, 400);
  }

  const parsed = checkoutSimulationSchema.safeParse(requestBody);

  if (!parsed.success) {
    return jsonResponse(
      { error: "Invalid request body", issues: parsed.error.issues },
      400,
    );
  }

  try {
    const { customer, order, checkoutSession } = await createSimulatedOrder({
      customerId: parsed.data.customerId,
      amountPaise: parsed.data.amountPaise,
      simulatorMode: "checkout",
      itemsSummary: parsed.data.itemsSummary,
    });

    if (!customer || !order || !checkoutSession) {
      return jsonResponse({ error: "Customer not found" }, 400);
    }

    const reconciliation = await reconcileCheckoutSession({
      id: checkoutSession.id,
      razorpayOrderId: checkoutSession.razorpayOrderId,
    });

    return jsonResponse({
      orderId: order.id,
      checkoutSessionId: checkoutSession.id,
      reconciliationOutcome: reconciliation.outcome,
      reconciliationDetail: reconciliation.detail,
      caseId: reconciliation.pipelineRun?.recoveryCaseId ?? null,
      pipelineRun: reconciliation.pipelineRun,
    });
  } catch (error) {
    return jsonResponse(
      {
        error: "Could not run the checkout simulation",
        detail: error instanceof Error ? error.message : JSON.stringify(error),
      },
      502,
    );
  }
}
