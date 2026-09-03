import { run } from "@openai/agents";
import type { ZodType } from "zod";

type RunnableAgent = Parameters<typeof run>[0];

export class DiagnosisAgentOutputError extends Error {
  constructor(agentName: string) {
    super(
      `Diagnosis agent "${agentName}" finished without producing a final output`,
    );
    this.name = "DiagnosisAgentOutputError";
  }
}

export const runDiagnosisAgent = async <TOutput>(
  agent: RunnableAgent,
  outputSchema: ZodType<TOutput>,
  context: unknown,
): Promise<TOutput> => {
  const result = await run(agent, JSON.stringify(context));

  if (result.finalOutput === undefined) {
    throw new DiagnosisAgentOutputError(agent.name);
  }

  return outputSchema.parse(result.finalOutput);
};
