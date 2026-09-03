import { PIPELINES } from "@/lib/pipelines/types";
import { prisma } from "@/lib/prisma";
import {
  jsonResponse,
  readGateOutcome,
  roundToOneDecimal,
  toIsoString,
} from "@/lib/api/serialize";

export const runtime = "nodejs";

export async function GET() {
  const [cases, actions, recentCases] = await Promise.all([
    prisma.recoveryCase.findMany({
      select: { id: true, pipeline: true, amount: true, diagnosis: true },
    }),
    prisma.recoveryAction.findMany({
      select: {
        status: true,
        outcome: true,
        amountRecovered: true,
        gateResult: true,
        recoveryCaseId: true,
      },
    }),
    prisma.recoveryCase.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        pipeline: true,
        amount: true,
        status: true,
        diagnosis: true,
        createdAt: true,
        customer: { select: { name: true } },
      },
    }),
  ]);

  const pipelineByCaseId = new Map(
    cases.map((recoveryCase) => [recoveryCase.id, recoveryCase.pipeline]),
  );

  const amountAtRisk = cases.reduce(
    (total, recoveryCase) => total + (recoveryCase.amount ?? 0),
    0,
  );
  const amountRecovered = actions.reduce(
    (total, action) => total + (action.amountRecovered ?? 0),
    0,
  );
  const actionsExecuted = actions.filter(
    (action) => action.status === "executed",
  ).length;
  const actionsBlocked = actions.filter(
    (action) => action.status === "blocked",
  ).length;
  const recoveredActions = actions.filter(
    (action) => action.outcome === "recovered",
  );

  const funnel = PIPELINES.map((pipeline) => {
    const pipelineCases = cases.filter(
      (recoveryCase) => recoveryCase.pipeline === pipeline,
    );
    const pipelineActions = actions.filter(
      (action) => pipelineByCaseId.get(action.recoveryCaseId) === pipeline,
    );

    return {
      pipeline,
      detected: pipelineCases.length,
      diagnosed: pipelineCases.filter(
        (recoveryCase) => recoveryCase.diagnosis !== null,
      ).length,
      allowed: pipelineActions.filter(
        (action) => readGateOutcome(action.gateResult) === "allow",
      ).length,
      executed: pipelineActions.filter((action) => action.status === "executed")
        .length,
      recovered: pipelineActions.filter(
        (action) => action.outcome === "recovered",
      ).length,
    };
  });

  const outcomeSplit = actions.reduce<Record<string, number>>(
    (counts, action) => ({
      ...counts,
      [action.status]: (counts[action.status] ?? 0) + 1,
    }),
    {},
  );

  const byPipeline = PIPELINES.map((pipeline) => {
    const pipelineCases = cases.filter(
      (recoveryCase) => recoveryCase.pipeline === pipeline,
    );
    const diagnosisCounts = pipelineCases.reduce<Record<string, number>>(
      (counts, recoveryCase) =>
        recoveryCase.diagnosis
          ? {
              ...counts,
              [recoveryCase.diagnosis]:
                (counts[recoveryCase.diagnosis] ?? 0) + 1,
            }
          : counts,
      {},
    );
    const topDiagnosis =
      Object.entries(diagnosisCounts).sort(
        ([, first], [, second]) => second - first,
      )[0]?.[0] ?? null;

    return {
      pipeline,
      cases: pipelineCases.length,
      amountAtRisk: pipelineCases.reduce(
        (total, recoveryCase) => total + (recoveryCase.amount ?? 0),
        0,
      ),
      amountRecovered: actions
        .filter(
          (action) => pipelineByCaseId.get(action.recoveryCaseId) === pipeline,
        )
        .reduce((total, action) => total + (action.amountRecovered ?? 0), 0),
      topDiagnosis,
    };
  });

  return jsonResponse({
    totals: {
      amountAtRisk,
      amountRecovered,
      recoveryRatePercent:
        cases.length === 0
          ? 0
          : roundToOneDecimal((recoveredActions.length / cases.length) * 100),
      casesOpened: cases.length,
      actionsExecuted,
      actionsBlocked,
    },
    funnel,
    outcomeSplit,
    byPipeline,
    recentCases: recentCases.map((recoveryCase) => ({
      id: recoveryCase.id,
      pipeline: recoveryCase.pipeline,
      customerName: recoveryCase.customer?.name ?? null,
      amount: recoveryCase.amount,
      status: recoveryCase.status,
      diagnosis: recoveryCase.diagnosis,
      createdAt: toIsoString(recoveryCase.createdAt),
    })),
  });
}
