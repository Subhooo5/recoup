import { prisma } from "@/lib/prisma";

export type ContactCooldownStatus = {
  lastContactedAt: Date | null;
  hoursSinceLastContact: number | null;
};

export const getContactCooldownStatus = async (
  customerId: string,
): Promise<ContactCooldownStatus> => {
  const mostRecentContact = await prisma.communicationEvent.findFirst({
    where: { customerId, sentAt: { not: null }, status: { not: "failed" } },
    orderBy: { sentAt: "desc" },
    select: { sentAt: true },
  });

  if (!mostRecentContact?.sentAt) {
    return { lastContactedAt: null, hoursSinceLastContact: null };
  }

  return {
    lastContactedAt: mostRecentContact.sentAt,
    hoursSinceLastContact:
      (Date.now() - mostRecentContact.sentAt.getTime()) / (60 * 60 * 1000),
  };
};
