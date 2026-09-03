import { Prisma, type RecoveryCase } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { Pipeline } from "@/lib/pipelines/types";

export type FindOrCreateRecoveryCaseInput = {
  pipeline: Pipeline;
  sourceId: string;
  entityType: string;
  customerId?: string | null;
  amount?: number | null;
};

export type FindOrCreateRecoveryCaseResult = {
  recoveryCase: RecoveryCase;
  created: boolean;
};

export const findOrCreateRecoveryCase = async (
  input: FindOrCreateRecoveryCaseInput,
): Promise<FindOrCreateRecoveryCaseResult> => {
  const caseIdentity = {
    pipeline: input.pipeline,
    sourceId: input.sourceId,
  };

  const existingRecoveryCase = await prisma.recoveryCase.findUnique({
    where: { pipeline_sourceId: caseIdentity },
  });

  if (existingRecoveryCase) {
    return { recoveryCase: existingRecoveryCase, created: false };
  }

  try {
    const recoveryCase = await prisma.recoveryCase.create({
      data: {
        ...caseIdentity,
        entityType: input.entityType,
        customerId: input.customerId ?? null,
        amount: input.amount ?? null,
      },
    });

    return { recoveryCase, created: true };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const racedRecoveryCase = await prisma.recoveryCase.findUniqueOrThrow({
        where: { pipeline_sourceId: caseIdentity },
      });

      return { recoveryCase: racedRecoveryCase, created: false };
    }

    throw error;
  }
};

export const hasExistingRecoveryAction = async (
  recoveryCaseId: string,
  actionType: string,
): Promise<boolean> => {
  const existingRecoveryAction = await prisma.recoveryAction.findUnique({
    where: { recoveryCaseId_actionType: { recoveryCaseId, actionType } },
    select: { id: true },
  });

  return existingRecoveryAction !== null;
};
