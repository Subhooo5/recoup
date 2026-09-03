import type { Prisma } from "@prisma/client";

export const toIsoString = (value: Date | null) =>
  value === null ? null : value.toISOString();

export const roundToOneDecimal = (value: number) =>
  Math.round(value * 10) / 10;

export const readGateOutcome = (gateResult: Prisma.JsonValue) => {
  if (gateResult === null || typeof gateResult !== "object") {
    return null;
  }

  const outcome = (gateResult as Record<string, unknown>).outcome;
  return typeof outcome === "string" ? outcome : null;
};

export const jsonResponse = (body: unknown, status = 200) =>
  Response.json(body, { status });
