export type LiveFeedEntry = {
  id: string;
  entityType: string;
  entityId: string;
  actor: string;
  action: string;
  detail: unknown;
  createdAt: string;
  pipeline: string | null;
  caseStatus: string | null;
  customerName: string | null;
};

export type LiveFeedResponse = {
  serverTime: string;
  items: LiveFeedEntry[];
};

export type CaseListItem = {
  id: string;
  pipeline: string;
  customer: { id: string; name: string } | null;
  amount: number | null;
  diagnosis: string | null;
  status: string;
  actionCount: number;
  createdAt: string;
};

export type CaseListResponse = {
  items: CaseListItem[];
  total: number;
  page: number;
  pageSize: number;
};

export type CaseDetailAction = {
  id: string;
  actionType: string;
  decisionJson: unknown;
  gateResult: unknown;
  status: string;
  outcome: string | null;
  amountRecovered: number | null;
  razorpayPaymentLinkId: string | null;
  executedAt: string | null;
  createdAt: string;
};

export type CaseDetailCommunication = {
  id: string;
  recoveryActionId: string;
  channel: string;
  providerMessageId: string | null;
  subject: string | null;
  status: string;
  sentAt: string | null;
  createdAt: string;
};

export type CaseAuditEntry = {
  id: string;
  actor: string;
  action: string;
  detail: unknown;
  createdAt: string;
};

export type CaseDetailResponse = {
  id: string;
  pipeline: string;
  entityType: string;
  sourceId: string;
  amount: number | null;
  diagnosis: string | null;
  diagnosisEvidence: unknown;
  status: string;
  createdAt: string;
  resolvedAt: string | null;
  customer: { id: string; name: string; email: string } | null;
  actions: CaseDetailAction[];
  communications: CaseDetailCommunication[];
  auditTrail: CaseAuditEntry[];
};

export type CustomerListItem = {
  id: string;
  name: string;
  email: string;
};

export type CustomerListResponse = {
  items: CustomerListItem[];
};

export type AuditListItem = {
  id: string;
  entityType: string;
  entityId: string;
  actor: string;
  action: string;
  detail: unknown;
  createdAt: string;
};

export type AuditListResponse = {
  items: AuditListItem[];
  total: number;
  page: number;
  pageSize: number;
};

export type PolicyItem = {
  id: string;
  name: string;
  pipeline: string;
  ruleType: string;
  config: unknown;
  active: boolean;
  createdAt: string;
};

export type PolicyListResponse = {
  items: PolicyItem[];
};

export type MetricsPipelineFunnel = {
  pipeline: string;
  detected: number;
  diagnosed: number;
  allowed: number;
  executed: number;
  recovered: number;
};

export type MetricsPipelineBreakdown = {
  pipeline: string;
  cases: number;
  amountAtRisk: number;
  amountRecovered: number;
  topDiagnosis: string | null;
};

export type MetricsOverviewResponse = {
  totals: {
    amountAtRisk: number;
    amountRecovered: number;
    recoveryRatePercent: number;
    casesOpened: number;
    actionsExecuted: number;
    actionsBlocked: number;
  };
  funnel: MetricsPipelineFunnel[];
  outcomeSplit: Record<string, number>;
  byPipeline: MetricsPipelineBreakdown[];
};
