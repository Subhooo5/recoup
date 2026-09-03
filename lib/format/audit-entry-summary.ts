import { formatRupees } from "@/lib/format/currency";
import { readGateChecks } from "@/lib/format/gate-result";
import {
  actionTypeLabel,
  countLabel,
  diagnosisLabel,
  gateCheckLabel,
  gateOutcomeLabel,
  humanizeIdentifier,
} from "@/lib/format/labels";
import {
  readDetailBoolean,
  readDetailNumber,
  readDetailObject,
  readDetailString,
} from "@/lib/format/json-detail";

const joinParts = (parts: (string | null)[]) =>
  parts.filter((part): part is string => Boolean(part)).join(" · ");

const summarizeCaseOpened = (detail: unknown) => {
  const entityType = readDetailString(detail, "entityType");
  const sourceId = readDetailString(detail, "sourceId");
  const amount = readDetailNumber(detail, "amount");
  const created = readDetailBoolean(detail, "created");

  return joinParts([
    entityType && sourceId ? `${entityType} ${sourceId}` : sourceId,
    amount === null ? null : `${formatRupees(amount)} at risk`,
    created === false ? "existing case reused" : null,
  ]);
};

const summarizeContextBuilt = (detail: unknown) => {
  const hoursSinceLastContact = readDetailNumber(
    detail,
    "hoursSinceLastContact",
  );

  const counts = [
    ["recentPayments", "payment"],
    ["checkoutHistory", "checkout"],
    ["subscriptionHistory", "subscription"],
    ["priorRecoveryAttempts", "prior attempt"],
  ] as const;

  const countParts = counts
    .map(([key, noun]) => {
      const value = readDetailNumber(detail, key);
      return value === null ? null : countLabel(value, noun);
    })
    .filter((part): part is string => part !== null)
    .join(", ");

  return joinParts([
    countParts || null,
    hoursSinceLastContact === null
      ? "no prior contact on record"
      : `last contact ${hoursSinceLastContact.toFixed(1)}h ago`,
  ]);
};

const summarizeDiagnosis = (detail: unknown) => {
  const diagnosis = readDetailString(detail, "diagnosis");
  const confidence = readDetailNumber(detail, "confidence");
  const proposedAction = readDetailString(detail, "proposedAction");

  return joinParts([
    diagnosis === null ? null : diagnosisLabel(diagnosis),
    confidence === null
      ? null
      : `${Math.round(confidence * 100)}% confidence`,
    proposedAction === null
      ? null
      : `proposes ${actionTypeLabel(proposedAction).toLowerCase()}`,
  ]);
};

const summarizeGateEvaluated = (detail: unknown) => {
  const outcome = readDetailString(detail, "outcome");
  const blockingCheck = readDetailString(detail, "blockingCheck");
  const checks = readGateChecks(detail);
  const passedCount = checks.filter((check) => check.passed).length;

  return joinParts([
    outcome === null ? null : gateOutcomeLabel(outcome),
    checks.length === 0
      ? null
      : `${passedCount} of ${checks.length} checks passed`,
    blockingCheck === null
      ? null
      : `stopped by ${gateCheckLabel(blockingCheck).toLowerCase()}`,
  ]);
};

const summarizeExecution = (detail: unknown) => {
  const explanation = readDetailString(detail, "detail");

  if (explanation) {
    return explanation;
  }

  const actionType = readDetailString(detail, "actionType");
  const status = readDetailString(detail, "status");

  return joinParts([
    actionType === null ? null : actionTypeLabel(actionType),
    status === null ? null : humanizeIdentifier(status),
  ]);
};

const summarizeUnknownDetail = (detail: unknown) => {
  const entry = readDetailObject(detail);

  if (!entry) {
    return "";
  }

  return Object.entries(entry)
    .filter(
      ([, value]) =>
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean",
    )
    .slice(0, 3)
    .map(([key, value]) => `${humanizeIdentifier(key)}: ${String(value)}`)
    .join(" · ");
};

export const summarizeAuditEntry = (action: string, detail: unknown) => {
  if (action === "case_opened") {
    return summarizeCaseOpened(detail);
  }

  if (action === "context_built") {
    return summarizeContextBuilt(detail);
  }

  if (action === "diagnosis_produced") {
    return summarizeDiagnosis(detail);
  }

  if (action === "gate_evaluated") {
    return summarizeGateEvaluated(detail);
  }

  if (action.startsWith("action_")) {
    return summarizeExecution(detail);
  }

  if (action === "pipeline_error") {
    return readDetailString(detail, "message") ?? summarizeUnknownDetail(detail);
  }

  return summarizeUnknownDetail(detail);
};
