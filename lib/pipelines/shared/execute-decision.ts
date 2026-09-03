import { Prisma, type Customer, type RecoveryCase } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { GateResult } from "@/lib/pipelines/shared/policy-gate";
import { notifyCustomer, requestCardUpdate, sendPaymentLink, type ExecutorInput, type ExecutorResult } from "@/lib/pipelines/shared/execution";
import type { RecoveryDecision } from "@/lib/pipelines/types";

export type ExecuteDecisionInput = {
  recoveryCase: RecoveryCase;
  customer: Customer | null;
  decision: RecoveryDecision;
  gateResult: GateResult;
};

export type ExecuteDecisionResult = {
  recoveryActionId: string | null;
  status: string;
  duplicate: boolean;
  executed: boolean;
  detail: string;
  razorpayPaymentLinkId: string | null;
};

const executorsByAction: Record<
  string,
  ((input: ExecutorInput) => Promise<ExecutorResult>) | undefined
> = {
  send_payment_link: sendPaymentLink,
  retry_alternate_route: sendPaymentLink,
  send_reminder: notifyCustomer,
  request_card_update: requestCardUpdate,
};

const statusForNonAllowOutcome = (gateResult: GateResult) => {
  if (gateResult.outcome === "no_action") {
    return "no_action";
  }

  if (gateResult.outcome === "human_review") {
    return "pending_review";
  }

  return "blocked";
};

const detailForNonAllowOutcome = (gateResult: GateResult) => {
  if (gateResult.outcome === "no_action") {
    return "The agent proposed no action and the policy gate raised no violation";
  }

  if (gateResult.outcome === "human_review") {
    return "Routed to human review because agent confidence was below the auto-execute threshold";
  }

  return `Blocked by policy check ${gateResult.blockingCheck ?? "unknown"}`;
};

export const executeDecision = async ({
  recoveryCase,
  customer,
  decision,
  gateResult,
}: ExecuteDecisionInput): Promise<ExecuteDecisionResult> => {
  let recoveryAction;

  try {
    recoveryAction = await prisma.recoveryAction.create({
      data: {
        recoveryCaseId: recoveryCase.id,
        actionType: decision.proposedAction,
        decisionJson: decision as unknown as Prisma.InputJsonObject,
        gateResult: gateResult as unknown as Prisma.InputJsonObject,
        status: "pending",
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        recoveryActionId: null,
        status: "duplicate",
        duplicate: true,
        executed: false,
        detail: `Action "${decision.proposedAction}" already exists for this case, so nothing was executed`,
        razorpayPaymentLinkId: null,
      };
    }

    throw error;
  }

  if (gateResult.outcome !== "allow") {
    const status = statusForNonAllowOutcome(gateResult);
    const detail = detailForNonAllowOutcome(gateResult);

    await prisma.recoveryAction.update({
      where: { id: recoveryAction.id },
      data: { status, outcome: detail },
    });

    return {
      recoveryActionId: recoveryAction.id,
      status,
      duplicate: false,
      executed: false,
      detail,
      razorpayPaymentLinkId: null,
    };
  }

  if (decision.proposedAction === "escalate_human") {
    const detail =
      "Agent proposed escalation to a human, so no automated contact was sent";

    await prisma.recoveryAction.update({
      where: { id: recoveryAction.id },
      data: { status: "pending_review", outcome: detail },
    });

    return {
      recoveryActionId: recoveryAction.id,
      status: "pending_review",
      duplicate: false,
      executed: false,
      detail,
      razorpayPaymentLinkId: null,
    };
  }

  const executor = executorsByAction[decision.proposedAction];

  if (!executor || !customer) {
    const detail = executor
      ? "No customer is attached to this case, so no action could be delivered"
      : `No executor is registered for action "${decision.proposedAction}"`;

    await prisma.recoveryAction.update({
      where: { id: recoveryAction.id },
      data: { status: "failed", outcome: detail },
    });

    return {
      recoveryActionId: recoveryAction.id,
      status: "failed",
      duplicate: false,
      executed: false,
      detail,
      razorpayPaymentLinkId: null,
    };
  }

  const executorResult = await executor({ recoveryCase, customer, decision });
  const executedAt = new Date();

  await prisma.recoveryAction.update({
    where: { id: recoveryAction.id },
    data: {
      status: executorResult.success ? "executed" : "failed",
      outcome: executorResult.detail,
      executedAt: executorResult.success ? executedAt : null,
      razorpayPaymentLinkId: executorResult.razorpayPaymentLinkId,
    },
  });

  await prisma.communicationEvent.create({
    data: {
      recoveryActionId: recoveryAction.id,
      customerId: customer.id,
      channel: "email",
      providerMessageId: executorResult.providerMessageId,
      subject: executorResult.subject,
      status: executorResult.success ? "sent" : "failed",
      sentAt: executorResult.success ? executedAt : null,
    },
  });

  return {
    recoveryActionId: recoveryAction.id,
    status: executorResult.success ? "executed" : "failed",
    duplicate: false,
    executed: executorResult.success,
    detail: executorResult.detail,
    razorpayPaymentLinkId: executorResult.razorpayPaymentLinkId,
  };
};

export const auditActionForExecution = (result: ExecuteDecisionResult) => {
  if (result.duplicate) {
    return "action_duplicate";
  }

  const auditActionByStatus: Record<string, string | undefined> = {
    executed: "action_executed",
    blocked: "action_blocked",
    no_action: "action_no_action",
    pending_review: "action_pending_review",
    failed: "action_failed",
  };

  return auditActionByStatus[result.status] ?? "action_recorded";
};

export const caseStatusForExecution = (
  gateResult: GateResult,
  result: ExecuteDecisionResult,
): { status: string; terminal: boolean } | null => {
  if (result.duplicate) {
    return null;
  }

  if (gateResult.outcome === "block") {
    return { status: "blocked", terminal: true };
  }

  if (gateResult.outcome === "no_action") {
    return { status: "closed", terminal: true };
  }

  if (result.status === "pending_review") {
    return { status: "awaiting_review", terminal: true };
  }

  if (result.executed) {
    return { status: "resolved", terminal: true };
  }

  return { status: "open", terminal: false };
};
