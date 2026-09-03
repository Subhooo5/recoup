export const readDetailObject = (
  value: unknown,
): Record<string, unknown> | null =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

export const readDetailString = (value: unknown, key: string) => {
  const entry = readDetailObject(value)?.[key];
  return typeof entry === "string" ? entry : null;
};

export const readDetailNumber = (value: unknown, key: string) => {
  const entry = readDetailObject(value)?.[key];
  return typeof entry === "number" && Number.isFinite(entry) ? entry : null;
};

export const readDetailBoolean = (value: unknown, key: string) => {
  const entry = readDetailObject(value)?.[key];
  return typeof entry === "boolean" ? entry : null;
};

export const readStringArray = (value: unknown) =>
  Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : [];

export const readDetailStringArray = (value: unknown, key: string) =>
  readStringArray(readDetailObject(value)?.[key]);
