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

const readOrderBy = (
  searchParams: URLSearchParams,
): Prisma.RecoveryCaseOrderByWithRelationInput => {
  const direction: Prisma.SortOrder =
    readTrimmed(searchParams, "direction") === "asc" ? "asc" : "desc";

  return readTrimmed(searchParams, "sort") === "amount"
    ? { amount: { sort: direction, nulls: "last" } }
    : { createdAt: direction };
};

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const { page, pageSize, skip } = readPagination(searchParams);

  const createdAt = buildDateRangeFilter(
    readDate(searchParams, "from"),
    readDate(searchParams, "to"),
  );

  const where: Prisma.RecoveryCaseWhereInput = {
    ...(readTrimmed(searchParams, "customerId")
      ? { customerId: readTrimmed(searchParams, "customerId") }
      : {}),
    ...(readTrimmed(searchParams, "pipeline")
      ? { pipeline: readTrimmed(searchParams, "pipeline") }
      : {}),
    ...(readTrimmed(searchParams, "status")
      ? { status: readTrimmed(searchParams, "status") }
      : {}),
    ...(createdAt ? { createdAt } : {}),
  };

  const [cases, total] = await Promise.all([
    prisma.recoveryCase.findMany({
      where,
      orderBy: readOrderBy(searchParams),
      skip,
      take: pageSize,
      select: {
        id: true,
        pipeline: true,
        amount: true,
        diagnosis: true,
        status: true,
        createdAt: true,
        customer: { select: { id: true, name: true } },
        _count: { select: { recoveryActions: true } },
      },
    }),
    prisma.recoveryCase.count({ where }),
  ]);

  return jsonResponse({
    items: cases.map((recoveryCase) => ({
      id: recoveryCase.id,
      pipeline: recoveryCase.pipeline,
      customer: recoveryCase.customer,
      amount: recoveryCase.amount,
      diagnosis: recoveryCase.diagnosis,
      status: recoveryCase.status,
      actionCount: recoveryCase._count.recoveryActions,
      createdAt: toIsoString(recoveryCase.createdAt),
    })),
    total,
    page,
    pageSize,
  });
}
