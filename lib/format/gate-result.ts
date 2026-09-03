import { readDetailObject, readDetailString } from "@/lib/format/json-detail";

export type GateCheck = {
  name: string;
  passed: boolean;
  detail: string;
};

export type GateResult = {
  outcome: string | null;
  blockingCheck: string | null;
  checks: GateCheck[];
};

const readGateCheck = (value: unknown): GateCheck | null => {
  const entry = readDetailObject(value);

  if (!entry) {
    return null;
  }

  const name = typeof entry.name === "string" ? entry.name : null;
  const passed = typeof entry.passed === "boolean" ? entry.passed : null;

  if (name === null || passed === null) {
    return null;
  }

  return {
    name,
    passed,
    detail: typeof entry.detail === "string" ? entry.detail : "",
  };
};

export const readGateChecks = (value: unknown): GateCheck[] => {
  const source = Array.isArray(value)
    ? value
    : readDetailObject(value)?.["checks"];

  if (!Array.isArray(source)) {
    return [];
  }

  return source
    .map(readGateCheck)
    .filter((check): check is GateCheck => check !== null);
};

export const readGateResult = (value: unknown): GateResult => ({
  outcome: readDetailString(value, "outcome"),
  blockingCheck: readDetailString(value, "blockingCheck"),
  checks: readGateChecks(value),
});
