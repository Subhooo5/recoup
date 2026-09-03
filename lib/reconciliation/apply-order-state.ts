import { prisma } from "@/lib/prisma";

export type OrderStateSnapshot = {
  status: string;
  amount_paid: number;
  amount_due: number;
  attempts: number;
};

export const applyOrderStateToSession = async (
  sessionId: string,
  order: OrderStateSnapshot,
) => {
  const checkoutSession = await prisma.checkoutSession.findUnique({
    where: { id: sessionId },
    select: { abandonedAt: true, recoveredAt: true },
  });

  if (!checkoutSession) {
    return;
  }

  const shouldMarkRecovered =
    checkoutSession.abandonedAt !== null && checkoutSession.recoveredAt === null;

  await prisma.checkoutSession.update({
    where: { id: sessionId },
    data: {
      status: order.status,
      amountPaid: order.amount_paid,
      amountDue: order.amount_due,
      attempts: order.attempts,
      recoveredAt: shouldMarkRecovered ? new Date() : undefined,
    },
  });
};
