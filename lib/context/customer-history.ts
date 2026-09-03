import { prisma } from "@/lib/prisma";

export const getRecentPaymentEvents = (customerId: string, limit = 10) =>
  prisma.paymentEvent.findMany({
    where: { customerId },
    orderBy: { razorpayCreatedAt: "desc" },
    take: limit,
    select: {
      eventType: true,
      amount: true,
      currency: true,
      method: true,
      status: true,
      errorCode: true,
      errorReason: true,
      razorpayCreatedAt: true,
    },
  });

export const getCheckoutHistory = (customerId: string, limit = 10) =>
  prisma.checkoutSession.findMany({
    where: { customerId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      amount: true,
      amountPaid: true,
      amountDue: true,
      status: true,
      attempts: true,
      cartValue: true,
      itemsSummary: true,
      paymentMethodSelected: true,
      createdAt: true,
      abandonedAt: true,
      recoveredAt: true,
    },
  });

export const getSubscriptionHistory = (customerId: string) =>
  prisma.subscription.findMany({
    where: { customerId },
    orderBy: { createdAt: "desc" },
    select: {
      planId: true,
      status: true,
      authAttempts: true,
      paidCount: true,
      remainingCount: true,
      chargeAt: true,
      lastFailureCode: true,
      lastFailureReason: true,
    },
  });

export const getPriorRecoveryAttempts = (customerId: string, limit = 10) =>
  prisma.recoveryCase.findMany({
    where: { customerId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      pipeline: true,
      diagnosis: true,
      status: true,
      createdAt: true,
      recoveryActions: {
        select: {
          actionType: true,
          status: true,
          outcome: true,
          executedAt: true,
        },
      },
    },
  });
