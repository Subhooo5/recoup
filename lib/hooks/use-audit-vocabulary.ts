"use client";

import { useQuery } from "@tanstack/react-query";

import type { AuditListResponse } from "@/lib/api/response-types";

const VOCABULARY_SAMPLE_SIZE = 200;

const sortedUniqueValues = (values: string[]) => [...new Set(values)].sort();

export const useAuditVocabulary = () => {
  const query = useQuery({
    queryKey: ["audit-vocabulary"],
    queryFn: async () => {
      const response = await fetch(
        `/api/audit?pageSize=${VOCABULARY_SAMPLE_SIZE}`,
      );

      if (!response.ok) {
        throw new Error(`Audit request failed with status ${response.status}`);
      }

      const body = (await response.json()) as AuditListResponse;

      return {
        actions: sortedUniqueValues(body.items.map((entry) => entry.action)),
        entityTypes: sortedUniqueValues(
          body.items.map((entry) => entry.entityType),
        ),
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  return {
    actions: query.data?.actions ?? [],
    entityTypes: query.data?.entityTypes ?? [],
    isLoading: query.isPending,
  };
};
