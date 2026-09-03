import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  buildDateRangeFilter,
  readDate,
  readPagination,
  readTrimmed,
} from "@/lib/api/query-params";
import { jsonResponse, toIsoString } from "@/lib/api/serialize";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const { page, pageSize, skip } = readPagination(searchParams, 50);

  const createdAt = buildDateRangeFilter(
    readDate(searchParams, "from"),
    readDate(searchParams, "to"),
  );

  const where: Prisma.AuditLogWhereInput = {
    ...(readTrimmed(searchParams, "entityType")
      ? { entityType: readTrimmed(searchParams, "entityType") }
      : {}),
    ...(readTrimmed(searchParams, "actor")
      ? { actor: readTrimmed(searchParams, "actor") }
      : {}),
    ...(readTrimmed(searchParams, "action")
      ? { action: readTrimmed(searchParams, "action") }
      : {}),
    ...(createdAt ? { createdAt } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return jsonResponse({
    items: items.map((entry) => ({
      id: entry.id,
      entityType: entry.entityType,
      entityId: entry.entityId,
      actor: entry.actor,
      action: entry.action,
      detail: entry.detail,
      createdAt: toIsoString(entry.createdAt),
    })),
    total,
    page,
    pageSize,
  });
}
