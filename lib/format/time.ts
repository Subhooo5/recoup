const SECOND_MS = 1000;
const MINUTE_MS = 60 * SECOND_MS;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

const absoluteFormatter = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "medium",
});

const calendarFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export const formatAbsoluteTime = (isoTimestamp: string) =>
  absoluteFormatter.format(new Date(isoTimestamp));

export const formatOptionalAbsoluteTime = (isoTimestamp: string | null) =>
  isoTimestamp === null ? "—" : formatAbsoluteTime(isoTimestamp);

export const formatRelativeTime = (
  isoTimestamp: string,
  nowMilliseconds: number,
) => {
  const elapsed = nowMilliseconds - new Date(isoTimestamp).getTime();

  if (elapsed < 5 * SECOND_MS) {
    return "just now";
  }

  if (elapsed < MINUTE_MS) {
    return `${Math.floor(elapsed / SECOND_MS)}s ago`;
  }

  if (elapsed < HOUR_MS) {
    return `${Math.floor(elapsed / MINUTE_MS)}m ago`;
  }

  if (elapsed < DAY_MS) {
    return `${Math.floor(elapsed / HOUR_MS)}h ago`;
  }

  if (elapsed < 7 * DAY_MS) {
    return `${Math.floor(elapsed / DAY_MS)}d ago`;
  }

  return calendarFormatter.format(new Date(isoTimestamp));
};

export const startOfDayIsoString = (calendarDate: string) => {
  const parsed = new Date(`${calendarDate}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};

export const endOfDayIsoString = (calendarDate: string) => {
  const parsed = new Date(`${calendarDate}T23:59:59.999`);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};
