import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { createOrder } from "@/lib/razorpay-helpers";

export const simulatorAmountSchema = z
  .number()
  .int()
  .min(100)
  .max(100000000);

export const createSimulatedOrder = async ({
  customerId,
  amountPaise,
  simulatorMode,
  itemsSummary,
}: {
  customerId: string;
  amountPaise: number;
  simulatorMode: string;
  itemsSummary?: string;
}) => {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: { id: true, name: true, email: true },
  });

  if (!customer) {
    return { customer: null, order: null, checkoutSession: null };
  }

  const order = await createOrder({
    amount: amountPaise,
    currency: "INR",
    receipt: `recoup_sim_${Date.now()}`,
    notes: { customerId: customer.id, simulatorMode },
  });

  const checkoutSession = await prisma.checkoutSession.create({
    data: {
      razorpayOrderId: order.id,
      customerId: customer.id,
      amount: amountPaise,
      amountPaid: order.amount_paid,
      amountDue: order.amount_due,
      currency: order.currency,
      receipt: order.receipt ?? null,
      status: order.status,
      attempts: order.attempts,
      notes: {
        customerId: customer.id,
        customerEmail: customer.email,
        customerName: customer.name,
        simulatorMode,
      },
      cartValue: amountPaise,
      itemsSummary: itemsSummary ?? null,
      createdAt: new Date(),
    },
  });

  return { customer, order, checkoutSession };
};
