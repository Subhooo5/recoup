"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

export type AuditFilterValues = {
  entityType: string;
  actor: string;
  action: string;
  from: string;
  to: string;
  page: number;
};

export type AuditFilterChanges = Partial<
  Record<keyof AuditFilterValues, string>
>;

const readPageNumber = (value: string | null) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
};

export const useAuditFilters = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const values = useMemo<AuditFilterValues>(
    () => ({
      entityType: searchParams.get("entityType") ?? "",
      actor: searchParams.get("actor") ?? "",
      action: searchParams.get("action") ?? "",
      from: searchParams.get("from") ?? "",
      to: searchParams.get("to") ?? "",
      page: readPageNumber(searchParams.get("page")),
    }),
    [searchParams],
  );

  const hasActiveFilters = Boolean(
    values.entityType || values.actor || values.action || values.from || values.to,
  );

  const applyChanges = useCallback(
    (changes: AuditFilterChanges, keepPage = false) => {
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

  return { values, hasActiveFilters, applyChanges, clearFilters, goToPage };
};
