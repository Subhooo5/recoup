import { prisma } from "@/lib/prisma";
import type { Pipeline } from "@/lib/pipelines/types";
import {
  getContactCooldownStatus,
  type ContactCooldownStatus,
} from "@/lib/context/cooldown";
import {
  getCheckoutHistory,
  getPriorRecoveryAttempts,
  getRecentPaymentEvents,
  getSubscriptionHistory,
} from "@/lib/context/customer-history";

export type ContextCustomer = {
  id: string;
  name: string;
  email: string;
};

export type CustomerHistory = {
  recentPayments: Awaited<ReturnType<typeof getRecentPaymentEvents>>;
  checkoutHistory: Awaited<ReturnType<typeof getCheckoutHistory>>;
  subscriptionHistory: Awaited<ReturnType<typeof getSubscriptionHistory>>;
  priorRecoveryAttempts: Awaited<ReturnType<typeof getPriorRecoveryAttempts>>;
};

export type PipelineContext<TTrigger> = {
  pipeline: Pipeline;
  customer: ContextCustomer | null;
  trigger: TTrigger;
  history: CustomerHistory;
  cooldown: ContactCooldownStatus;
};

export type BuildContextInput<TTrigger> = {
  pipeline: Pipeline;
  customerId: string | null;
  trigger: TTrigger;
};

const emptyHistory: CustomerHistory = {
  recentPayments: [],
  checkoutHistory: [],
  subscriptionHistory: [],
  priorRecoveryAttempts: [],
};

const noContactCooldown: ContactCooldownStatus = {
  lastContactedAt: null,
  hoursSinceLastContact: null,
};

export const buildContext = async <TTrigger>({
  pipeline,
  customerId,
  trigger,
}: BuildContextInput<TTrigger>): Promise<PipelineContext<TTrigger>> => {
  if (!customerId) {
    return {
      pipeline,
      customer: null,
      trigger,
      history: emptyHistory,
      cooldown: noContactCooldown,
    };
  }

  const [
    customer,
    recentPayments,
    checkoutHistory,
    subscriptionHistory,
    priorRecoveryAttempts,
    cooldown,
  ] = await Promise.all([
    prisma.customer.findUnique({
      where: { id: customerId },
      select: { id: true, name: true, email: true },
    }),
    getRecentPaymentEvents(customerId),
    getCheckoutHistory(customerId),
    getSubscriptionHistory(customerId),
    getPriorRecoveryAttempts(customerId),
    getContactCooldownStatus(customerId),
  ]);

  return {
    pipeline,
    customer,
    trigger,
    history: {
      recentPayments,
      checkoutHistory,
      subscriptionHistory,
      priorRecoveryAttempts,
    },
    cooldown,
  };
};
