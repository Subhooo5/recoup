import { prisma } from "@/lib/prisma";
import { jsonResponse, toIsoString } from "@/lib/api/serialize";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const recoveryCase = await prisma.recoveryCase.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, name: true, email: true } },
      recoveryActions: {
        orderBy: { createdAt: "asc" },
        include: {
          communicationEvents: { orderBy: { createdAt: "asc" } },
        },
      },
    },
  });

  if (!recoveryCase) {
    return jsonResponse({ error: "Recovery case not found" }, 404);
  }

  const auditTrail = await prisma.auditLog.findMany({
    where: { entityType: "RecoveryCase", entityId: id },
    orderBy: { createdAt: "asc" },
  });

  return jsonResponse({
    id: recoveryCase.id,
    pipeline: recoveryCase.pipeline,
    entityType: recoveryCase.entityType,
    sourceId: recoveryCase.sourceId,
    amount: recoveryCase.amount,
    diagnosis: recoveryCase.diagnosis,
    diagnosisEvidence: recoveryCase.diagnosisEvidence,
    status: recoveryCase.status,
    createdAt: toIsoString(recoveryCase.createdAt),
    resolvedAt: toIsoString(recoveryCase.resolvedAt),
    customer: recoveryCase.customer,
    actions: recoveryCase.recoveryActions.map((action) => ({
      id: action.id,
      actionType: action.actionType,
      decisionJson: action.decisionJson,
      gateResult: action.gateResult,
      status: action.status,
      outcome: action.outcome,
      amountRecovered: action.amountRecovered,
      razorpayPaymentLinkId: action.razorpayPaymentLinkId,
      executedAt: toIsoString(action.executedAt),
      createdAt: toIsoString(action.createdAt),
    })),
    communications: recoveryCase.recoveryActions.flatMap((action) =>
      action.communicationEvents.map((event) => ({
        id: event.id,
        recoveryActionId: action.id,
        channel: event.channel,
        providerMessageId: event.providerMessageId,
        subject: event.subject,
        status: event.status,
        sentAt: toIsoString(event.sentAt),
        createdAt: toIsoString(event.createdAt),
      })),
    ),
    auditTrail: auditTrail.map((entry) => ({
      id: entry.id,
      actor: entry.actor,
      action: entry.action,
      detail: entry.detail,
      createdAt: toIsoString(entry.createdAt),
    })),
  });
}
