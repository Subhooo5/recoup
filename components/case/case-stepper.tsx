"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  ChevronDown,
  Gavel,
  Radar,
  Rocket,
  Scale,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState, type ReactNode } from "react";

import { GateOutcomeBadge } from "@/components/badges/gate-outcome-badge";
import { ConfidenceMeter } from "@/components/badges/confidence-meter";
import { EvidenceList } from "@/components/case/evidence-list";
import { ExecutionResult } from "@/components/case/execution-result";
import { GateChecksList } from "@/components/case/gate-checks-list";
import type {
  CaseDetailAction,
  CaseDetailResponse,
} from "@/lib/api/response-types";
import { formatOptionalRupees } from "@/lib/format/currency";
import { readDecision } from "@/lib/format/decision";
import { readGateResult } from "@/lib/format/gate-result";
import {
  readDetailBoolean,
  readDetailNumber,
  readDetailString,
  readStringArray,
} from "@/lib/format/json-detail";
import { actionTypeLabel, diagnosisLabel } from "@/lib/format/labels";
import { formatAbsoluteTime } from "@/lib/format/time";
import { cn } from "@/lib/utils";

type CaseStageProps = {
  step: number;
  title: string;
  caption: string;
  icon: LucideIcon;
  badge?: ReactNode;
  emphasized?: boolean;
  children: ReactNode;
};

function CaseStage({
  step,
  title,
  caption,
  icon: Icon,
  badge,
  emphasized = false,
  children,
}: CaseStageProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <section
      className={cn(
        "rounded-xl border transition-colors duration-200",
        emphasized
          ? "border-brand-indigo/40 bg-brand-indigo/[0.03] shadow-sm"
          : "border-border",
      )}
    >
      <button
        type="button"
        onClick={() => setIsExpanded((expanded) => !expanded)}
        aria-expanded={isExpanded}
        className="flex w-full cursor-pointer items-center gap-3 px-4 py-3.5 text-left"
      >
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-medium",
            emphasized
              ? "border-brand-indigo/40 bg-brand-indigo/10 text-brand-indigo-readable"
              : "border-border bg-muted text-muted-foreground",
          )}
        >
          {step}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <Icon className="size-4 shrink-0 text-muted-foreground" />
            <span className="font-heading text-base font-semibold tracking-tight">
              {title}
            </span>
          </span>
          <span className="mt-0.5 block text-xs text-muted-foreground">
            {caption}
          </span>
        </span>

        {badge}

        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform duration-200 ease-out",
            isExpanded && "rotate-180",
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {isExpanded ? (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-border px-4 py-4">{children}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}

function DefinitionGrid({
  entries,
}: {
  entries: { term: string; value: ReactNode }[];
}) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      {entries.map((entry) => (
        <div key={entry.term} className="grid gap-0.5">
          <dt className="text-xs font-medium text-muted-foreground">
            {entry.term}
          </dt>
          <dd className="text-sm break-words">{entry.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function ActionStages({
  recoveryCase,
  action,
}: {
  recoveryCase: CaseDetailResponse;
  action: CaseDetailAction;
}) {
  const decision = readDecision(action.decisionJson);
  const gateResult = readGateResult(action.gateResult);
  const communications = recoveryCase.communications.filter(
    (communication) => communication.recoveryActionId === action.id,
  );

  return (
    <>
      <CaseStage
        step={3}
        title="Decide"
        caption="What the agent proposed, before any policy was applied"
        icon={Scale}
      >
        <DefinitionGrid
          entries={[
            {
              term: "Proposed action",
              value: actionTypeLabel(
                decision.proposedAction ?? action.actionType,
              ),
            },
            {
              term: "Maximum attempts",
              value:
                decision.maxAttempts === null ? "—" : decision.maxAttempts,
            },
            {
              term: "Recorded action type",
              value: (
                <span className="font-mono text-xs">{action.actionType}</span>
              ),
            },
            {
              term: "Proposed at",
              value: formatAbsoluteTime(action.createdAt),
            },
          ]}
        />
      </CaseStage>

      <CaseStage
        step={4}
        title="Gate"
        caption="Deterministic policy checks in plain code — the only path to an executor"
        icon={Gavel}
        emphasized
        badge={<GateOutcomeBadge outcome={gateResult.outcome} size="large" />}
      >
        <GateChecksList
          checks={gateResult.checks}
          blockingCheck={gateResult.blockingCheck}
        />
      </CaseStage>

      <CaseStage
        step={5}
        title="Execute → Result"
        caption="What actually ran, and what it recovered"
        icon={Rocket}
      >
        <ExecutionResult action={action} communications={communications} />
      </CaseStage>
    </>
  );
}

type CaseStepperProps = {
  recoveryCase: CaseDetailResponse;
};

export function CaseStepper({ recoveryCase }: CaseStepperProps) {
  const caseOpenedEntry = recoveryCase.auditTrail.find(
    (entry) => entry.action === "case_opened",
  );
  const diagnosisEntry = recoveryCase.auditTrail.find(
    (entry) => entry.action === "diagnosis_produced",
  );

  const confidence = readDetailNumber(diagnosisEntry?.detail, "confidence");
  const agentReason = readDetailString(diagnosisEntry?.detail, "reason");
  const reusedExistingCase =
    readDetailBoolean(caseOpenedEntry?.detail, "created") === false;

  const evidence = readStringArray(recoveryCase.diagnosisEvidence);

  return (
    <div className="grid gap-3">
      <CaseStage
        step={1}
        title="Detect"
        caption="The signal that put this revenue at risk"
        icon={Radar}
      >
        <DefinitionGrid
          entries={[
            { term: "Trigger entity", value: recoveryCase.entityType },
            {
              term: "Source id",
              value: (
                <span className="font-mono text-xs">
                  {recoveryCase.sourceId}
                </span>
              ),
            },
            {
              term: "Amount at risk",
              value: formatOptionalRupees(recoveryCase.amount),
            },
            {
              term: "Detected at",
              value: formatAbsoluteTime(
                caseOpenedEntry?.createdAt ?? recoveryCase.createdAt,
              ),
            },
          ]}
        />
        {reusedExistingCase ? (
          <p className="mt-3 text-xs text-muted-foreground">
            This trigger matched an existing case rather than opening a new one,
            so the idempotency key held.
          </p>
        ) : null}
      </CaseStage>

      <CaseStage
        step={2}
        title="Diagnose"
        caption="The pipeline agent's reading of the evidence"
        icon={Sparkles}
      >
        {recoveryCase.diagnosis === null ? (
          <p className="text-sm text-muted-foreground">
            No diagnosis was recorded for this case. The agent did not complete
            a run against it.
          </p>
        ) : (
          <div className="grid gap-4">
            <DefinitionGrid
              entries={[
                {
                  term: "Diagnosis",
                  value: (
                    <span className="font-medium">
                      {diagnosisLabel(recoveryCase.diagnosis)}
                    </span>
                  ),
                },
                {
                  term: "Recorded value",
                  value: (
                    <span className="font-mono text-xs">
                      {recoveryCase.diagnosis}
                    </span>
                  ),
                },
              ]}
            />

            <div className="grid gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Evidence
              </span>
              <EvidenceList evidence={evidence} />
            </div>

            {confidence === null ? null : (
              <ConfidenceMeter confidence={confidence} />
            )}

            {agentReason ? (
              <div className="grid gap-1">
                <span className="text-xs font-medium text-muted-foreground">
                  Agent reasoning
                </span>
                <p className="text-sm">{agentReason}</p>
              </div>
            ) : null}
          </div>
        )}
      </CaseStage>

      {recoveryCase.actions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-4 py-6 text-center">
          <p className="text-sm text-muted-foreground">
            No recovery action was recorded for this case, so there is nothing
            to decide, gate or execute yet.
          </p>
        </div>
      ) : (
        recoveryCase.actions.map((action, index) => (
          <div key={action.id} className="grid gap-3">
            {recoveryCase.actions.length > 1 ? (
              <div className="flex items-center gap-3 pt-3">
                <span className="font-heading text-sm font-semibold tracking-tight">
                  Action {index + 1} of {recoveryCase.actions.length} ·{" "}
                  {actionTypeLabel(action.actionType)}
                </span>
                <span className="h-px flex-1 bg-border" />
              </div>
            ) : null}
            <ActionStages recoveryCase={recoveryCase} action={action} />
          </div>
        ))
      )}
    </div>
  );
}
