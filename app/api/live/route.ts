import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { readDate, readTrimmed } from "@/lib/api/query-params";
import { jsonResponse, toIsoString } from "@/lib/api/serialize";

export const runtime = "nodejs";

const LIVE_FEED_LIMIT = 100;

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const since = readDate(searchParams, "since");
  const caseId = readTrimmed(searchParams, "caseId");

  const where: Prisma.AuditLogWhereInput = {
    ...(since ? { createdAt: { gt: since } } : {}),
    ...(caseId ? { entityId: caseId } : {}),
  };

  const entries = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: LIVE_FEED_LIMIT,
  });

  const recoveryCaseIds = entries
    .filter((entry) => entry.entityType === "RecoveryCase")
    .map((entry) => entry.entityId);

  const recoveryCases = recoveryCaseIds.length
    ? await prisma.recoveryCase.findMany({
        where: { id: { in: recoveryCaseIds } },
        select: {
          id: true,
          pipeline: true,
          status: true,
          customer: { select: { name: true } },
        },
      })
    : [];

  const casesById = new Map(
    recoveryCases.map((recoveryCase) => [recoveryCase.id, recoveryCase]),
  );

  return jsonResponse({
    serverTime: new Date().toISOString(),
    items: entries.map((entry) => {
      const linkedCase =
        entry.entityType === "RecoveryCase"
          ? casesById.get(entry.entityId)
          : undefined;

      return {
        id: entry.id,
        entityType: entry.entityType,
        entityId: entry.entityId,
        actor: entry.actor,
        action: entry.action,
        detail: entry.detail,
        createdAt: toIsoString(entry.createdAt),
        pipeline: linkedCase?.pipeline ?? null,
        caseStatus: linkedCase?.status ?? null,
        customerName: linkedCase?.customer?.name ?? null,
      };
    }),
  });
}
