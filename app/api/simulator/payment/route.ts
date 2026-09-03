import { z } from "zod";

import { jsonResponse } from "@/lib/api/serialize";
import {
  createSimulatedOrder,
  simulatorAmountSchema,
} from "@/lib/api/simulator-orders";

export const runtime = "nodejs";

const paymentSimulationSchema = z.object({
  customerId: z.string().min(1),
  amountPaise: simulatorAmountSchema,
});

export async function POST(request: Request) {
  let requestBody: unknown;

  try {
    requestBody = await request.json();
  } catch {
    return jsonResponse({ error: "Request body must be valid JSON" }, 400);
  }

  const parsed = paymentSimulationSchema.safeParse(requestBody);

  if (!parsed.success) {
    return jsonResponse(
      { error: "Invalid request body", issues: parsed.error.issues },
      400,
    );
  }

  const razorpayKeyId = process.env.RAZORPAY_KEY_ID;

  if (!razorpayKeyId) {
    return jsonResponse({ error: "Razorpay key is not configured" }, 500);
  }

  try {
    const { customer, order } = await createSimulatedOrder({
      customerId: parsed.data.customerId,
      amountPaise: parsed.data.amountPaise,
      simulatorMode: "payment",
    });

    if (!customer || !order) {
      return jsonResponse({ error: "Customer not found" }, 400);
    }

    return jsonResponse({
      orderId: order.id,
      amount: parsed.data.amountPaise,
      currency: order.currency,
      razorpayKeyId,
      customer,
    });
  } catch (error) {
    return jsonResponse(
      {
        error: "Could not create the Razorpay order",
        detail: error instanceof Error ? error.message : JSON.stringify(error),
      },
      502,
    );
  }
}
