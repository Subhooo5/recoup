"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

export type CaseSortField = "createdAt" | "amount";
export type CaseSortDirection = "asc" | "desc";

export type CaseFilterValues = {
  customerId: string;
  pipeline: string;
  status: string;
  from: string;
  to: string;
  page: number;
  sort: CaseSortField;
  direction: CaseSortDirection;
};

export type CaseFilterChanges = Partial<Record<keyof CaseFilterValues, string>>;

const readPageNumber = (value: string | null) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
};

export const useCaseFilters = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const values = useMemo<CaseFilterValues>(
    () => ({
      customerId: searchParams.get("customerId") ?? "",
      pipeline: searchParams.get("pipeline") ?? "",
      status: searchParams.get("status") ?? "",
      from: searchParams.get("from") ?? "",
      to: searchParams.get("to") ?? "",
      page: readPageNumber(searchParams.get("page")),
      sort: searchParams.get("sort") === "amount" ? "amount" : "createdAt",
      direction: searchParams.get("direction") === "asc" ? "asc" : "desc",
    }),
    [searchParams],
  );

  const hasActiveFilters = Boolean(
    values.customerId ||
      values.pipeline ||
      values.status ||
      values.from ||
      values.to,
  );

  const applyChanges = useCallback(
    (changes: CaseFilterChanges, keepPage = false) => {
      const nextParams = new URLSearchParams(searchParams.toString());

      Object.entries(changes).forEach(([key, value]) => {
        if (value) {
          nextParams.set(key, value);
        } else {
          nextParams.delete(key);
        }
      });

      if (!keepPage) {
        nextParams.delete("page");
      }

      const query = nextParams.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const clearFilters = useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [pathname, router]);

  const goToPage = useCallback(
    (page: number) => {
      applyChanges({ page: page > 1 ? String(page) : "" }, true);
    },
    [applyChanges],
  );

  const toggleSort = useCallback(
    (field: CaseSortField) => {
      const nextDirection: CaseSortDirection =
        values.sort === field && values.direction === "desc" ? "asc" : "desc";

      applyChanges({
        sort: field === "createdAt" ? "" : field,
        direction: nextDirection === "desc" ? "" : nextDirection,
      });
    },
    [applyChanges, values.direction, values.sort],
  );

  return {
    values,
    hasActiveFilters,
    applyChanges,
    clearFilters,
    goToPage,
    toggleSort,
  };
};
