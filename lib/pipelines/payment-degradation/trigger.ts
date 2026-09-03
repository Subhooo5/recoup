import type { PaymentEvent } from "@prisma/client";

import type { PaymentDegradationTrigger } from "@/lib/pipelines/types";

export type PaymentDegradationQualification =
  | { qualifies: false; reason: string }
  | {
      qualifies: true;
      sourceId: string;
      entityType: string;
      customerId: string | null;
      amount: number;
      trigger: PaymentDegradationTrigger;
    };

export const qualifyPaymentDegradation = (
  paymentEvent: PaymentEvent,
): PaymentDegradationQualification => {
  if (paymentEvent.eventType !== "payment.failed") {
    return {
      qualifies: false,
      reason: `Event type ${paymentEvent.eventType} is not payment.failed`,
    };
  }

  return {
    qualifies: true,
    sourceId: paymentEvent.razorpayPaymentId,
    entityType: "PaymentEvent",
    customerId: paymentEvent.customerId,
    amount: paymentEvent.amount,
    trigger: {
      razorpayPaymentId: paymentEvent.razorpayPaymentId,
      amount: paymentEvent.amount,
      currency: paymentEvent.currency,
      method: paymentEvent.method,
      errorCode: paymentEvent.errorCode,
      errorDescription: paymentEvent.errorDescription,
      errorReason: paymentEvent.errorReason,
      errorSource: paymentEvent.errorSource,
      errorStep: paymentEvent.errorStep,
    },
  };
};
