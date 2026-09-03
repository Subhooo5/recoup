import {
  readDetailNumber,
  readDetailString,
  readDetailStringArray,
} from "@/lib/format/json-detail";

export type RecoveryDecisionSummary = {
  pipeline: string | null;
  diagnosis: string | null;
  evidence: string[];
  confidence: number | null;
  proposedAction: string | null;
  reason: string | null;
  maxAttempts: number | null;
};

export const readDecision = (value: unknown): RecoveryDecisionSummary => ({
  pipeline: readDetailString(value, "pipeline"),
  diagnosis: readDetailString(value, "diagnosis"),
  evidence: readDetailStringArray(value, "evidence"),
  confidence: readDetailNumber(value, "confidence"),
  proposedAction: readDetailString(value, "proposedAction"),
  reason: readDetailString(value, "reason"),
  maxAttempts: readDetailNumber(value, "maxAttempts"),
});
