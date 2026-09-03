import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type AuditActor = "system" | "agent" | "human";

export type AuditLogEntry = {
  entityType: string;
  entityId: string;
  actor: AuditActor;
  action: string;
  detail: Prisma.InputJsonValue;
};

export const appendAuditLog = (entry: AuditLogEntry) =>
  prisma.auditLog.create({ data: entry });
