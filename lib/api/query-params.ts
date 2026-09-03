export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 200;

export type PaginationParams = {
  page: number;
  pageSize: number;
  skip: number;
};

export const readPagination = (
  searchParams: URLSearchParams,
  defaultPageSize = DEFAULT_PAGE_SIZE,
): PaginationParams => {
  const requestedPage = Number(searchParams.get("page"));
  const requestedPageSize = Number(searchParams.get("pageSize"));

  const page =
    Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const pageSize =
    Number.isInteger(requestedPageSize) && requestedPageSize > 0
      ? Math.min(requestedPageSize, MAX_PAGE_SIZE)
      : defaultPageSize;

  return { page, pageSize, skip: (page - 1) * pageSize };
};

export const readTrimmed = (searchParams: URLSearchParams, key: string) => {
  const value = searchParams.get(key)?.trim();
  return value ? value : undefined;
};

export const readDate = (searchParams: URLSearchParams, key: string) => {
  const value = readTrimmed(searchParams, key);

  if (!value) {
    return undefined;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

export const buildDateRangeFilter = (from?: Date, to?: Date) => {
  if (!from && !to) {
    return undefined;
  }

  return { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) };
};
