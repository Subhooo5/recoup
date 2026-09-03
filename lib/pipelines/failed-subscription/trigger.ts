import type { Subscription } from "@prisma/client";

import { fetchPlan } from "@/lib/razorpay-helpers";
import type { FailedSubscriptionTrigger } from "@/lib/pipelines/types";

const qualifyingStatuses = ["pending", "halted"];

export type FailedSubscriptionQualification =
  | { qualifies: false; reason: string }
  | {
      qualifies: true;
      sourceId: string;
      entityType: string;
      customerId: string | null;
      amount: number | null;
      amountResolutionDetail: string | null;
      trigger: FailedSubscriptionTrigger;
    };

const resolvePlanAmount = async (planId: string) => {
  try {
    const plan = await fetchPlan(planId);
    const rawAmount = plan.item?.amount;
    const amount =
      typeof rawAmount === "string" ? Number(rawAmount) : rawAmount;

    if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
      return {
        amount: null,
        detail: `Plan ${planId} returned no usable item amount`,
      };
    }

    return { amount: Math.round(amount), detail: null };
  } catch (error) {
    return {
      amount: null,
      detail: `Plan ${planId} could not be fetched: ${
        error instanceof Error ? error.message : JSON.stringify(error)
      }`,
    };
  }
};

export const qualifyFailedSubscription = async (
  subscription: Subscription,
): Promise<FailedSubscriptionQualification> => {
  if (!qualifyingStatuses.includes(subscription.status)) {
    return {
      qualifies: false,
      reason: `Subscription status ${subscription.status} is not pending or halted`,
    };
  }

  const planAmount = await resolvePlanAmount(subscription.planId);

  return {
    qualifies: true,
    sourceId: subscription.razorpaySubscriptionId,
    entityType: "Subscription",
    customerId: subscription.customerId,
    amount: planAmount.amount,
    amountResolutionDetail: planAmount.detail,
    trigger: {
      razorpaySubscriptionId: subscription.razorpaySubscriptionId,
      planId: subscription.planId,
      status: subscription.status,
      authAttempts: subscription.authAttempts,
      chargeAt: subscription.chargeAt,
      paidCount: subscription.paidCount,
      remainingCount: subscription.remainingCount,
      lastFailureCode: subscription.lastFailureCode,
      lastFailureReason: subscription.lastFailureReason,
    },
  };
};
