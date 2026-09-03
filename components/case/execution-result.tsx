import { ExternalLink } from "lucide-react";

import { CommunicationRecord } from "@/components/case/communication-record";
import type {
  CaseDetailAction,
  CaseDetailCommunication,
} from "@/lib/api/response-types";
import { formatRupees } from "@/lib/format/currency";
import { readGateResult } from "@/lib/format/gate-result";
import {
  actionOutcomeLabel,
  actionStatusLabel,
  actionTypeLabel,
  gateOutcomeLabel,
} from "@/lib/format/labels";
import { formatAbsoluteTime } from "@/lib/format/time";
import { cn } from "@/lib/utils";

const RAZORPAY_PAYMENT_LINK_DASHBOARD_URL =
  "https://dashboard.razorpay.com/app/payment-links";

const statusTreatments: Record<string, string> = {
  executed: "border-brand-emerald/35 bg-brand-emerald/10 text-brand-emerald-readable",
  completed: "border-transparent bg-brand-emerald text-white",
  failed: "border-destructive/45 bg-destructive/10 text-destructive",
  blocked: "border-destructive/45 bg-destructive/10 text-destructive",
  pending_review:
    "border-dashed border-brand-indigo/60 bg-brand-indigo/10 text-brand-indigo-readable",
  no_action: "border-border bg-muted text-muted-foreground",
  pending: "border-border bg-muted text-muted-foreground",
};

const knownOutcomeTokens = new Set(["recovered", "expired"]);

type ExecutionResultProps = {
  action: CaseDetailAction;
  communications: CaseDetailCommunication[];
};

export function ExecutionResult({
  action,
  communications,
}: ExecutionResultProps) {
  const gateResult = readGateResult(action.gateResult);
  const gateAllowedExecution = gateResult.outcome === "allow";
  const outcomeText =
    action.outcome === null
      ? null
      : knownOutcomeTokens.has(action.outcome)
        ? actionOutcomeLabel(action.outcome)
        : action.outcome;

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
            statusTreatments[action.status] ??
              "border-border bg-muted text-muted-foreground",
          )}
        >
          {actionStatusLabel(action.status)}
        </span>
        <span className="text-sm text-muted-foreground">
          {actionTypeLabel(action.actionType)}
        </span>
        {action.executedAt ? (
          <span className="ml-auto text-xs text-muted-foreground">
            Executed {formatAbsoluteTime(action.executedAt)}
          </span>
        ) : null}
      </div>

      {!gateAllowedExecution ? (
        <p className="rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm">
          Nothing was executed. The policy gate returned{" "}
          <span className="font-medium">
            {gateOutcomeLabel(gateResult.outcome)}
          </span>
          , and only an allow outcome may reach an executor.
        </p>
      ) : null}

      {outcomeText ? (
        <div className="grid gap-1">
          <span className="text-xs font-medium text-muted-foreground">
            Outcome
          </span>
          <p className="text-sm">{outcomeText}</p>
        </div>
      ) : null}

      {action.amountRecovered !== null ? (
        <div className="rounded-xl border border-brand-emerald/35 bg-brand-emerald/5 px-4 py-3">
          <span className="text-xs font-medium text-muted-foreground">
            Amount recovered
          </span>
          <p className="font-heading text-2xl font-semibold tracking-tight text-brand-emerald-readable">
            {formatRupees(action.amountRecovered)}
          </p>
        </div>
      ) : null}

      {action.razorpayPaymentLinkId ? (
        <div className="grid gap-1">
          <span className="text-xs font-medium text-muted-foreground">
            Razorpay payment link
          </span>
          <a
            href={`${RAZORPAY_PAYMENT_LINK_DASHBOARD_URL}/${action.razorpayPaymentLinkId}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-fit cursor-pointer items-center gap-1.5 font-mono text-sm text-brand-indigo-readable transition-opacity duration-200 hover:opacity-80"
          >
            {action.razorpayPaymentLinkId}
            <ExternalLink className="size-3.5" />
          </a>
        </div>
      ) : null}

      <div className="grid gap-2">
        <span className="text-xs font-medium text-muted-foreground">
          Customer communication
        </span>
        <CommunicationRecord communications={communications} />
      </div>
    </div>
  );
}
