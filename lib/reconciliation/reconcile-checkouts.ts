import type { CheckoutSession } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { fetchOrder } from "@/lib/razorpay-helpers";
import { runCheckoutDropoff } from "@/lib/pipelines/checkout-dropoff/run";
import { applyOrderStateToSession } from "@/lib/reconciliation/apply-order-state";
import type { PipelineRunResult } from "@/lib/pipelines/types";

export const CHECKOUT_ABANDONMENT_THRESHOLD_MINUTES = 30;

const RECONCILIATION_BATCH_SIZE = 50;

export type ReconciliationSummary = {
  checked: number;
  markedAbandoned: number;
  foundAlreadyPaid: number;
  partiallyPaid: number;
  pipelineRunsStarted: number;
  failed: number;
};

export type SessionReconciliationOutcome =
  | "already_paid"
  | "partially_paid"
  | "marked_abandoned"
  | "failed";

export type SessionReconciliationResult = {
  outcome: SessionReconciliationOutcome;
  detail: string;
  pipelineRun: PipelineRunResult | null;
};

export const reconcileCheckoutSession = async (staleSession: {
  id: string;
  razorpayOrderId: string;
}): Promise<SessionReconciliationResult> => {
  try {
    const order = await fetchOrder(staleSession.razorpayOrderId);

    if (order.status === "paid") {
      await applyOrderStateToSession(staleSession.id, order);

      return {
        outcome: "already_paid",
        detail: `Order ${staleSession.razorpayOrderId} was already paid`,
        pipelineRun: null,
      };
    }

    const checkedAt = new Date();
    const orderIsPartiallyPaid = order.amount_paid > 0;

    const reconciledSession: CheckoutSession =
      await prisma.checkoutSession.update({
        where: { id: staleSession.id },
        data: {
          status: order.status,
          attempts: order.attempts,
          amountPaid: order.amount_paid,
          amountDue: order.amount_due,
          abandonedAt: orderIsPartiallyPaid ? undefined : checkedAt,
          lastCheckedAt: checkedAt,
        },
      });

    if (orderIsPartiallyPaid) {
      return {
        outcome: "partially_paid",
        detail: `Order ${staleSession.razorpayOrderId} is partially paid and was not marked abandoned`,
        pipelineRun: null,
      };
    }

    return {
      outcome: "marked_abandoned",
      detail: `Order ${staleSession.razorpayOrderId} was marked abandoned`,
      pipelineRun: await runCheckoutDropoff(reconciledSession),
    };
  } catch (error) {
    console.error(
      `reconciliation failed for order ${staleSession.razorpayOrderId}`,
      error,
    );

    return {
      outcome: "failed",
      detail:
        error instanceof Error ? error.message : JSON.stringify(error),
      pipelineRun: null,
    };
  }
};

export const reconcileCheckouts = async (): Promise<ReconciliationSummary> => {
  const abandonmentCutoff = new Date(
    Date.now() - CHECKOUT_ABANDONMENT_THRESHOLD_MINUTES * 60 * 1000,
  );

  const staleSessions = await prisma.checkoutSession.findMany({
    where: {
      status: { in: ["created", "attempted"] },
      abandonedAt: null,
      createdAt: { lt: abandonmentCutoff },
    },
    orderBy: { createdAt: "asc" },
    take: RECONCILIATION_BATCH_SIZE,
    select: { id: true, razorpayOrderId: true },
  });

  let markedAbandoned = 0;
  let foundAlreadyPaid = 0;
  let partiallyPaid = 0;
  let pipelineRunsStarted = 0;
  let failed = 0;

  for (const staleSession of staleSessions) {
    const result = await reconcileCheckoutSession(staleSession);

    if (result.outcome === "already_paid") {
      foundAlreadyPaid += 1;
    } else if (result.outcome === "partially_paid") {
      partiallyPaid += 1;
    } else if (result.outcome === "marked_abandoned") {
      markedAbandoned += 1;
      pipelineRunsStarted += 1;
    } else {
      failed += 1;
    }
  }

  return {
    checked: staleSessions.length,
    markedAbandoned,
    foundAlreadyPaid,
    partiallyPaid,
    pipelineRunsStarted,
    failed,
  };
};
