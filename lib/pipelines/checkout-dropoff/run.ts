import type { CheckoutSession } from "@prisma/client";

import { buildContext } from "@/lib/context/build-context";
import { findOrCreateRecoveryCase } from "@/lib/context/idempotency";
import { prisma } from "@/lib/prisma";
import { diagnoseCheckoutDropoff } from "@/lib/pipelines/checkout-dropoff/agent";
import { qualifyCheckoutDropoff } from "@/lib/pipelines/checkout-dropoff/trigger";
import { appendAuditLog } from "@/lib/pipelines/shared/audit";
import { auditActionForExecution, caseStatusForExecution, executeDecision } from "@/lib/pipelines/shared/execute-decision";
import { evaluatePolicyGate } from "@/lib/pipelines/shared/policy-gate";
import { normalizeDecision, type PipelineRunResult } from "@/lib/pipelines/types";

const PIPELINE = "checkout-dropoff" as const;

const terminalCaseStatuses = ["resolved", "closed", "blocked", "awaiting_review"];

const describeError = (error: unknown) =>
  error instanceof Error ? error.message : JSON.stringify(error);

export const runCheckoutDropoff = async (
  checkoutSession: CheckoutSession,
): Promise<PipelineRunResult> => {
  const qualification = qualifyCheckoutDropoff(checkoutSession);

  if (!qualification.qualifies) {
    return {
      ran: false,
      reason: qualification.reason,
      recoveryCaseId: null,
      caseStatus: null,
      diagnosis: null,
      confidence: null,
      proposedAction: null,
      gateOutcome: null,
      blockingCheck: null,
      actionStatus: null,
      duplicate: false,
      caseStatusNote: null,
      detail: null,
    };
  }

  const { recoveryCase, created } = await findOrCreateRecoveryCase({
    pipeline: PIPELINE,
    sourceId: qualification.sourceId,
    entityType: qualification.entityType,
    customerId: qualification.customerId,
    amount: qualification.amount,
  });

  if (!created && terminalCaseStatuses.includes(recoveryCase.status)) {
    return {
      ran: false,
      reason: `Case already has terminal status ${recoveryCase.status}`,
      recoveryCaseId: recoveryCase.id,
      caseStatus: recoveryCase.status,
      diagnosis: recoveryCase.diagnosis,
      confidence: null,
      proposedAction: null,
      gateOutcome: null,
      blockingCheck: null,
      actionStatus: null,
      duplicate: false,
      caseStatusNote: null,
      detail: null,
    };
  }

  if (!created) {
    const existingActionCount = await prisma.recoveryAction.count({
      where: { recoveryCaseId: recoveryCase.id },
    });

    if (existingActionCount > 0) {
      return {
        ran: false,
        reason: `Case has already been processed and carries ${existingActionCount} recovery action row(s)`,
        recoveryCaseId: recoveryCase.id,
        caseStatus: recoveryCase.status,
        diagnosis: recoveryCase.diagnosis,
        confidence: null,
        proposedAction: null,
        gateOutcome: null,
        blockingCheck: null,
        actionStatus: null,
        duplicate: false,
        caseStatusNote: null,
        detail: null,
      };
    }
  }

  await appendAuditLog({
    entityType: "RecoveryCase",
    entityId: recoveryCase.id,
    actor: "system",
    action: "case_opened",
    detail: {
      pipeline: PIPELINE,
      sourceId: qualification.sourceId,
      entityType: qualification.entityType,
      amount: qualification.amount,
      created,
    },
  });

  try {
    const context = await buildContext({
      pipeline: PIPELINE,
      customerId: qualification.customerId,
      trigger: qualification.trigger,
    });

    await appendAuditLog({
      entityType: "RecoveryCase",
      entityId: recoveryCase.id,
      actor: "system",
      action: "context_built",
      detail: {
        recentPayments: context.history.recentPayments.length,
        checkoutHistory: context.history.checkoutHistory.length,
        subscriptionHistory: context.history.subscriptionHistory.length,
        priorRecoveryAttempts: context.history.priorRecoveryAttempts.length,
        hoursSinceLastContact: context.cooldown.hoursSinceLastContact,
      },
    });

    const agentOutput = await diagnoseCheckoutDropoff(context);

    await appendAuditLog({
      entityType: "RecoveryCase",
      entityId: recoveryCase.id,
      actor: "agent",
      action: "diagnosis_produced",
      detail: {
        diagnosis: agentOutput.diagnosis,
        evidence: agentOutput.evidence,
        confidence: agentOutput.confidence,
        proposedAction: agentOutput.proposedAction,
        reason: agentOutput.reason,
        maxAttempts: agentOutput.maxAttempts,
      },
    });

    await prisma.recoveryCase.update({
      where: { id: recoveryCase.id },
      data: {
        diagnosis: agentOutput.diagnosis,
        diagnosisEvidence: agentOutput.evidence,
      },
    });

    const decision = normalizeDecision(PIPELINE, agentOutput);
    const gateResult = await evaluatePolicyGate({
      decision,
      context,
      recoveryCaseId: recoveryCase.id,
    });

    await appendAuditLog({
      entityType: "RecoveryCase",
      entityId: recoveryCase.id,
      actor: "system",
      action: "gate_evaluated",
      detail: {
        outcome: gateResult.outcome,
        blockingCheck: gateResult.blockingCheck,
        checks: gateResult.checks,
      },
    });

    const customer = qualification.customerId
      ? await prisma.customer.findUnique({
          where: { id: qualification.customerId },
        })
      : null;

    const executionResult = await executeDecision({
      recoveryCase,
      customer,
      decision,
      gateResult,
    });

    await appendAuditLog({
      entityType: "RecoveryCase",
      entityId: recoveryCase.id,
      actor: "system",
      action: auditActionForExecution(executionResult),
      detail: {
        actionType: decision.proposedAction,
        recoveryActionId: executionResult.recoveryActionId,
        status: executionResult.status,
        duplicate: executionResult.duplicate,
        razorpayPaymentLinkId: executionResult.razorpayPaymentLinkId,
        detail: executionResult.detail,
      },
    });

    const nextCaseStatus = caseStatusForExecution(gateResult, executionResult);

    if (nextCaseStatus) {
      await prisma.recoveryCase.update({
        where: { id: recoveryCase.id },
        data: {
          status: nextCaseStatus.status,
          ...(nextCaseStatus.terminal && recoveryCase.resolvedAt === null
            ? { resolvedAt: new Date() }
            : {}),
        },
      });
    }

    return {
      ran: true,
      reason: null,
      recoveryCaseId: recoveryCase.id,
      caseStatus: nextCaseStatus?.status ?? recoveryCase.status,
      diagnosis: agentOutput.diagnosis,
      confidence: agentOutput.confidence,
      proposedAction: agentOutput.proposedAction,
      gateOutcome: gateResult.outcome,
      blockingCheck: gateResult.blockingCheck,
      actionStatus: executionResult.status,
      duplicate: executionResult.duplicate,
      caseStatusNote: executionResult.duplicate
        ? "Case status left unchanged because this action was already recorded for this case"
        : null,
      detail: executionResult.detail,
    };
  } catch (error) {
    const message = describeError(error);

    await appendAuditLog({
      entityType: "RecoveryCase",
      entityId: recoveryCase.id,
      actor: "system",
      action: "pipeline_error",
      detail: { pipeline: PIPELINE, message },
    });

    return {
      ran: true,
      reason: null,
      recoveryCaseId: recoveryCase.id,
      caseStatus: recoveryCase.status,
      diagnosis: null,
      confidence: null,
      proposedAction: null,
      gateOutcome: null,
      blockingCheck: null,
      actionStatus: null,
      duplicate: false,
      caseStatusNote: null,
      detail: message,
    };
  }
};
