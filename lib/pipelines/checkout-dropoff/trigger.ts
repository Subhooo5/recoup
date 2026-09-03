import type { CheckoutSession } from "@prisma/client";

import type { CheckoutDropoffTrigger } from "@/lib/pipelines/types";

export type CheckoutDropoffQualification =
  | { qualifies: false; reason: string }
  | {
      qualifies: true;
      sourceId: string;
      entityType: string;
      customerId: string | null;
      amount: number;
      trigger: CheckoutDropoffTrigger;
    };

export const qualifyCheckoutDropoff = (
  checkoutSession: CheckoutSession,
): CheckoutDropoffQualification => {
  if (checkoutSession.abandonedAt === null) {
    return { qualifies: false, reason: "Session has not been marked abandoned" };
  }

  if (checkoutSession.recoveredAt !== null) {
    return { qualifies: false, reason: "Session has already been recovered" };
  }

  return {
    qualifies: true,
    sourceId: checkoutSession.razorpayOrderId,
    entityType: "CheckoutSession",
    customerId: checkoutSession.customerId,
    amount: checkoutSession.amountDue,
    trigger: {
      razorpayOrderId: checkoutSession.razorpayOrderId,
      amount: checkoutSession.amount,
      amountDue: checkoutSession.amountDue,
      attempts: checkoutSession.attempts,
      cartValue: checkoutSession.cartValue,
      itemsSummary: checkoutSession.itemsSummary,
      paymentMethodSelected: checkoutSession.paymentMethodSelected,
      abandonedAt: checkoutSession.abandonedAt,
    },
  };
};
