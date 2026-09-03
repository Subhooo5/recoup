"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import type { LiveFeedEntry, LiveFeedResponse } from "@/lib/api/response-types";

export const LIVE_FEED_POLL_INTERVAL_MS = 2500;
export const LIVE_FEED_STALE_AFTER_MS = LIVE_FEED_POLL_INTERVAL_MS * 3;

const MAX_RETAINED_ENTRIES = 300;
const liveFeedQueryKey = ["live-feed"] as const;

type LiveFeedSnapshot = {
  entries: LiveFeedEntry[];
  cursor: string;
  lastSuccessAt: number;
};

const mergeEntries = (
  existing: LiveFeedEntry[],
  incoming: LiveFeedEntry[],
): LiveFeedEntry[] => {
  if (incoming.length === 0) {
    return existing;
  }

  const existingIds = new Set(existing.map((entry) => entry.id));
  const additions = incoming.filter((entry) => !existingIds.has(entry.id));

  if (additions.length === 0) {
    return existing;
  }

  return [...additions, ...existing]
    .sort(
      (first, second) =>
        second.createdAt.localeCompare(first.createdAt) ||
        second.id.localeCompare(first.id),
    )
    .slice(0, MAX_RETAINED_ENTRIES);
};

export const useLiveFeed = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: liveFeedQueryKey,
    queryFn: async (): Promise<LiveFeedSnapshot> => {
      const previous =
        queryClient.getQueryData<LiveFeedSnapshot>(liveFeedQueryKey);

      const response = await fetch(
        previous
          ? `/api/live?since=${encodeURIComponent(previous.cursor)}`
          : "/api/live",
      );

      if (!response.ok) {
        throw new Error(`Live feed request failed with status ${response.status}`);
      }

      const body = (await response.json()) as LiveFeedResponse;

      return {
        entries: mergeEntries(previous?.entries ?? [], body.items),
        cursor: body.serverTime,
        lastSuccessAt: Date.now(),
      };
    },
    refetchInterval: LIVE_FEED_POLL_INTERVAL_MS,
    refetchOnWindowFocus: true,
    retry: false,
    gcTime: Number.POSITIVE_INFINITY,
  });

  return {
    entries: query.data?.entries ?? [],
    lastSuccessAt: query.data?.lastSuccessAt ?? null,
    isLoading: query.isPending,
    isFailing: query.isError,
    errorMessage:
      query.error instanceof Error
        ? query.error.message
        : "The live feed could not be reached",
    refetch: query.refetch,
  };
};
