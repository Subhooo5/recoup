import { createHmac, randomUUID } from "crypto";

import { z } from "zod";

import { jsonResponse } from "@/lib/api/serialize";
import { prisma } from "@/lib/prisma";
import { razorpay } from "@/lib/razorpay";

export const runtime = "nodejs";

const SIMULATOR_PLAN_NAME = "Recoup simulator plan";

const subscriptionSimulationSchema = z.object({
  customerId: z.string().min(1),
  planAmountPaise: z.number().int().min(100).max(100000000),
  errorCode: z.enum(["GATEWAY_ERROR", "BAD_REQUEST_ERROR"]),
  errorReason: z.enum([
    "payment_failed",
    "insufficient_funds",
    "payment_timed_out",
  ]),
  event: z.enum(["subscription.pending", "subscription.halted"]),
});

const resolveSimulatorPlanId = async (planAmountPaise: number) => {
  const existingPlans = await razorpay.plans.all({ count: 100 });
  const matchingPlan = existingPlans.items.find(
    (plan) => Number(plan.item?.amount) === planAmountPaise,
  );

  if (matchingPlan) {
    return matchingPlan.id;
  }

  const createdPlan = await razorpay.plans.create({
    period: "monthly",
    interval: 1,
    item: {
      name: SIMULATOR_PLAN_NAME,
      amount: planAmountPaise,
      currency: "INR",
    },
  });

  return createdPlan.id;
};

export async function POST(request: Request) {
  let requestBody: unknown;

  try {
    requestBody = await request.json();
  } catch {
    return jsonResponse({ error: "Request body must be valid JSON" }, 400);
  }

  const parsed = subscriptionSimulationSchema.safeParse(requestBody);

  if (!parsed.success) {
    return jsonResponse(
      { error: "Invalid request body", issues: parsed.error.issues },
      400,
    );
  }

  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const applicationUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!webhookSecret) {
    return jsonResponse(
      { error: "RAZORPAY_WEBHOOK_SECRET is not configured" },
      500,
    );
  }

  if (!applicationUrl) {
    return jsonResponse(
      { error: "NEXT_PUBLIC_APP_URL is not configured" },
      500,
    );
  }

  const customer = await prisma.customer.findUnique({
    where: { id: parsed.data.customerId },
    select: { id: true, name: true, email: true },
  });

  if (!customer) {
    return jsonResponse({ error: "Customer not found" }, 400);
  }

  try {
    const planId = await resolveSimulatorPlanId(parsed.data.planAmountPaise);

    const existingSubscription = await prisma.subscription.findFirst({
      where: { customerId: customer.id },
      orderBy: { createdAt: "desc" },
    });

    const chargeAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

    const subscription = existingSubscription
      ? await prisma.subscription.update({
          where: { id: existingSubscription.id },
          data: { planId, chargeAt },
        })
      : await prisma.subscription.create({
          data: {
            razorpaySubscriptionId: `sub_sim_${randomUUID().replace(/-/g, "").slice(0, 14)}`,
            customerId: customer.id,
            planId,
            status: "active",
            authAttempts: 0,
            totalCount: 12,
            paidCount: 3,
            remainingCount: 9,
            chargeAt,
            createdAt: new Date(),
          },
        });

    const nextStatus =
      parsed.data.event === "subscription.halted" ? "halted" : "pending";

    const webhookPayload = {
      entity: "event",
      account_id: "acc_recoup_simulator",
      event: parsed.data.event,
      contains: ["subscription", "payment"],
      created_at: Math.floor(Date.now() / 1000),
      payload: {
        subscription: {
          entity: {
            id: subscription.razorpaySubscriptionId,
            entity: "subscription",
            plan_id: planId,
            status: nextStatus,
            auth_attempts: subscription.authAttempts + 1,
            charge_at: Math.floor(chargeAt.getTime() / 1000),
            paid_count: subscription.paidCount,
            remaining_count: subscription.remainingCount,
          },
        },
        payment: {
          entity: {
            id: `pay_sim_${randomUUID().replace(/-/g, "").slice(0, 14)}`,
            entity: "payment",
            amount: parsed.data.planAmountPaise,
            currency: "INR",
            status: "failed",
            method: "card",
            error_code: parsed.data.errorCode,
            error_description: "Simulated subscription charge failure",
            error_reason: parsed.data.errorReason,
            error_source: "bank",
            error_step: "payment_authorization",
            created_at: Math.floor(Date.now() / 1000),
          },
        },
      },
    };

    const rawBody = JSON.stringify(webhookPayload);
    const signature = createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");
    const razorpayEventId = `evt_sim_${randomUUID().replace(/-/g, "").slice(0, 18)}`;

    const webhookResponse = await fetch(
      new URL("/api/webhooks/razorpay", applicationUrl).toString(),
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-razorpay-signature": signature,
          "x-razorpay-event-id": razorpayEventId,
        },
        body: rawBody,
      },
    );

    const recoveryCase = await prisma.recoveryCase.findUnique({
      where: {
        pipeline_sourceId: {
          pipeline: "failed-subscription",
          sourceId: subscription.razorpaySubscriptionId,
        },
      },
      select: { id: true },
    });

    return jsonResponse({
      webhookStatus: webhookResponse.status,
      razorpayEventId,
      razorpaySubscriptionId: subscription.razorpaySubscriptionId,
      planId,
      caseId: recoveryCase?.id ?? null,
    });
  } catch (error) {
    return jsonResponse(
      {
        error: "Could not run the subscription simulation",
        detail: error instanceof Error ? error.message : JSON.stringify(error),
      },
      502,
    );
  }
}
