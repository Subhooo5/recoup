import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { applyOrderStateToSession } from "@/lib/reconciliation/apply-order-state";
import { runPaymentDegradation } from "@/lib/pipelines/payment-degradation/run";
import { runFailedSubscription } from "@/lib/pipelines/failed-subscription/run";
import { verifyWebhookSignature } from "@/lib/verify-webhook-signature";

export const runtime = "nodejs";

type RazorpayWebhookPaymentEntity = {
  id: string;
  order_id: string | null;
  amount: number;
  currency: string;
  method: string | null;
  status: string;
  error_code: string | null;
  error_description: string | null;
  error_reason: string | null;
  error_source: string | null;
  error_step: string | null;
  contact: string | null;
  email: string | null;
  created_at: number;
};

type RazorpayWebhookOrderEntity = {
  id: string;
  status: string;
  amount_paid: number;
  amount_due: number;
  attempts: number;
};

type RazorpayWebhookPaymentLinkEntity = {
  id: string;
  status: string;
  amount?: number;
  amount_paid?: number;
};

type RazorpayWebhookSubscriptionEntity = {
  id: string;
  status: string;
  auth_attempts: number;
  charge_at: number | null;
};

type RazorpayWebhookBody = {
  event: string;
  account_id?: string;
  payload: {
    payment?: { entity: RazorpayWebhookPaymentEntity };
    order?: { entity: RazorpayWebhookOrderEntity };
    payment_link?: { entity: RazorpayWebhookPaymentLinkEntity };
    subscription?: { entity: RazorpayWebhookSubscriptionEntity };
  };
};

const credentialFieldNames = new Set([
  "number",
  "card_number",
  "cvv",
  "expiry_month",
  "expiry_year",
  "pin",
  "upi_pin",
]);

const stripCredentialFields = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(stripCredentialFields);
  }

  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([key]) => !credentialFieldNames.has(key))
        .map(([key, nestedValue]) => [key, stripCredentialFields(nestedValue)]),
    );
  }

  return value;
};

const resolveCustomerId = async (payment: RazorpayWebhookPaymentEntity) => {
  if (payment.order_id) {
    const checkoutSession = await prisma.checkoutSession.findUnique({
      where: { razorpayOrderId: payment.order_id },
      select: { customerId: true },
    });

    if (checkoutSession?.customerId) {
      return checkoutSession.customerId;
    }
  }

  if (payment.email) {
    const customer = await prisma.customer.findUnique({
      where: { email: payment.email },
      select: { id: true },
    });

    if (customer) {
      return customer.id;
    }
  }

  return null;
};

const normalizePayment = async (
  webhookBody: RazorpayWebhookBody,
  rawPayload: Prisma.InputJsonObject,
) => {
  const payment = webhookBody.payload.payment?.entity;

  if (!payment) {
    return;
  }

  const customerId = await resolveCustomerId(payment);

  const paymentEventFields = {
    razorpayOrderId: payment.order_id ?? null,
    eventType: webhookBody.event,
    customerId,
    amount: payment.amount,
    currency: payment.currency,
    method: payment.method ?? null,
    status: payment.status,
    errorCode: payment.error_code ?? null,
    errorDescription: payment.error_description ?? null,
    errorReason: payment.error_reason ?? null,
    errorSource: payment.error_source ?? null,
    errorStep: payment.error_step ?? null,
    contact: payment.contact ?? null,
    email: payment.email ?? null,
    razorpayCreatedAt: new Date(payment.created_at * 1000),
    rawPayload,
  };

  return prisma.paymentEvent.upsert({
    where: { razorpayPaymentId: payment.id },
    create: { razorpayPaymentId: payment.id, ...paymentEventFields },
    update: paymentEventFields,
  });
};

const normalizeOrderPaid = async (webhookBody: RazorpayWebhookBody) => {
  const order = webhookBody.payload.order?.entity;

  if (!order) {
    return;
  }

  const checkoutSession = await prisma.checkoutSession.findUnique({
    where: { razorpayOrderId: order.id },
    select: { id: true },
  });

  if (!checkoutSession) {
    console.warn(`order.paid received for unknown order ${order.id}`);
    return;
  }

  await applyOrderStateToSession(checkoutSession.id, order);
};

const normalizePaymentLink = async (webhookBody: RazorpayWebhookBody) => {
  const paymentLink = webhookBody.payload.payment_link?.entity;

  if (!paymentLink) {
    return;
  }

  const [checkoutSession, recoveryAction] = await Promise.all([
    prisma.checkoutSession.findUnique({
      where: { razorpayPaymentLinkId: paymentLink.id },
      select: { id: true, recoveredAt: true },
    }),
    prisma.recoveryAction.findUnique({
      where: { razorpayPaymentLinkId: paymentLink.id },
      select: { id: true, executedAt: true, recoveryCaseId: true },
    }),
  ]);

  if (!checkoutSession && !recoveryAction) {
    console.warn(
      `${webhookBody.event} received for unmatched payment link ${paymentLink.id}`,
    );
    return;
  }

  const paymentLinkWasPaid = webhookBody.event === "payment_link.paid";

  if (checkoutSession && paymentLinkWasPaid) {
    await prisma.checkoutSession.update({
      where: { id: checkoutSession.id },
      data: {
        status: "paid",
        recoveredAt: checkoutSession.recoveredAt ?? new Date(),
      },
    });
  }

  if (recoveryAction) {
    const recoveryCase = await prisma.recoveryCase.findUnique({
      where: { id: recoveryAction.recoveryCaseId },
      select: { amount: true, resolvedAt: true },
    });

    const amountRecovered = paymentLinkWasPaid
      ? (paymentLink.amount_paid ?? recoveryCase?.amount ?? null)
      : null;

    await prisma.recoveryAction.update({
      where: { id: recoveryAction.id },
      data: {
        status: "completed",
        outcome: paymentLinkWasPaid ? "recovered" : "expired",
        executedAt: recoveryAction.executedAt ?? new Date(),
        amountRecovered,
      },
    });

    if (paymentLinkWasPaid) {
      await prisma.recoveryCase.update({
        where: { id: recoveryAction.recoveryCaseId },
        data: {
          status: "resolved",
          ...(recoveryCase?.resolvedAt ? {} : { resolvedAt: new Date() }),
        },
      });
    }
  }
};

const normalizeSubscription = async (webhookBody: RazorpayWebhookBody) => {
  const subscription = webhookBody.payload.subscription?.entity;

  if (!subscription) {
    return;
  }

  const existingSubscription = await prisma.subscription.findUnique({
    where: { razorpaySubscriptionId: subscription.id },
    select: { id: true },
  });

  if (!existingSubscription) {
    console.warn(
      `${webhookBody.event} received for unknown subscription ${subscription.id}`,
    );
    return;
  }

  const chargeAttemptPayment = webhookBody.payload.payment?.entity;

  return prisma.subscription.update({
    where: { razorpaySubscriptionId: subscription.id },
    data: {
      status: subscription.status,
      authAttempts: subscription.auth_attempts,
      chargeAt: subscription.charge_at
        ? new Date(subscription.charge_at * 1000)
        : null,
      lastFailureCode: chargeAttemptPayment
        ? chargeAttemptPayment.error_code
        : undefined,
      lastFailureReason: chargeAttemptPayment
        ? chargeAttemptPayment.error_reason
        : undefined,
    },
  });
};

export async function POST(request: Request) {
  const rawBody = await request.text();
  const receivedSignature = request.headers.get("x-razorpay-signature");

  const signatureIsValid = verifyWebhookSignature(
    rawBody,
    receivedSignature,
    process.env.RAZORPAY_WEBHOOK_SECRET,
  );

  if (!signatureIsValid) {
    return new Response(null, { status: 400 });
  }

  const razorpayEventId = request.headers.get("x-razorpay-event-id");

  if (!razorpayEventId) {
    return new Response(null, { status: 400 });
  }

  const existingWebhookEvent = await prisma.webhookEvent.findUnique({
    where: { razorpayEventId },
    select: { id: true, status: true },
  });

  if (existingWebhookEvent?.status === "processed") {
    return new Response(null, { status: 200 });
  }

  const sanitizedBody: unknown = stripCredentialFields(JSON.parse(rawBody));
  const sanitizedPayload = sanitizedBody as Prisma.InputJsonObject;
  const webhookBody = sanitizedBody as RazorpayWebhookBody;

  const webhookEventId =
    existingWebhookEvent?.id ??
    (
      await prisma.webhookEvent.create({
        data: {
          razorpayEventId,
          eventType: webhookBody.event,
          accountId: webhookBody.account_id ?? null,
          payload: sanitizedPayload,
          status: "received",
        },
        select: { id: true },
      })
    ).id;

  let normalizedPaymentEvent:
    | Awaited<ReturnType<typeof normalizePayment>>
    | null = null;
  let normalizedSubscription:
    | Awaited<ReturnType<typeof normalizeSubscription>>
    | null = null;

  try {
    switch (webhookBody.event) {
      case "payment.failed":
      case "payment.captured":
        normalizedPaymentEvent = await normalizePayment(
          webhookBody,
          sanitizedPayload,
        );
        break;
      case "order.paid":
        await normalizeOrderPaid(webhookBody);
        break;
      case "payment_link.paid":
      case "payment_link.expired":
        await normalizePaymentLink(webhookBody);
        break;
      case "subscription.pending":
      case "subscription.halted":
      case "subscription.charged":
      case "subscription.cancelled":
        normalizedSubscription = await normalizeSubscription(webhookBody);
        break;
      default:
        break;
    }
  } catch (error) {
    console.error(
      `normalization failed for ${webhookBody.event} event ${razorpayEventId}`,
      error,
    );

    await prisma.webhookEvent.update({
      where: { id: webhookEventId },
      data: { status: "failed" },
    });

    return new Response(null, { status: 500 });
  }

  await prisma.webhookEvent.update({
    where: { id: webhookEventId },
    data: { status: "processed", processedAt: new Date() },
  });

  try {
    if (webhookBody.event === "payment.failed" && normalizedPaymentEvent) {
      await runPaymentDegradation(normalizedPaymentEvent);
    }

    if (
      (webhookBody.event === "subscription.pending" ||
        webhookBody.event === "subscription.halted") &&
      normalizedSubscription
    ) {
      await runFailedSubscription(normalizedSubscription);
    }
  } catch (error) {
    console.error(
      `pipeline run failed for ${webhookBody.event} event ${razorpayEventId}`,
      error,
    );
  }

  return new Response(null, { status: 200 });
}
