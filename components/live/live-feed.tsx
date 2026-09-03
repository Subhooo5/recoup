"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUp, Inbox, Pause, Play, SearchX } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { EmptyState } from "@/components/data/empty-state";
import { ErrorState } from "@/components/data/error-state";
import { LoadingSkeleton } from "@/components/data/loading-skeleton";
import {
  FeedFilters,
  type FeedFilterValues,
} from "@/components/live/feed-filters";
import { LiveFeedRow } from "@/components/live/live-feed-row";
import type { LiveFeedEntry } from "@/lib/api/response-types";
import { useCurrentTime } from "@/lib/hooks/use-current-time";
import {
  LIVE_FEED_POLL_INTERVAL_MS,
  LIVE_FEED_STALE_AFTER_MS,
  useLiveFeed,
} from "@/lib/hooks/use-live-feed";
import { countLabel } from "@/lib/format/labels";
import { formatRelativeTime } from "@/lib/format/time";
import { cn } from "@/lib/utils";

const RECENT_WINDOW_MS = 5 * 60 * 1000;
const FOLLOW_SCROLL_THRESHOLD_PX = 8;

const emptyFilters: FeedFilterValues = { pipeline: "", actor: "", action: "" };

const sortedUniqueValues = (values: (string | null)[]) =>
  [...new Set(values.filter((value): value is string => Boolean(value)))].sort();

const matchesFilters = (entry: LiveFeedEntry, filters: FeedFilterValues) =>
  (!filters.pipeline || entry.pipeline === filters.pipeline) &&
  (!filters.actor || entry.actor === filters.actor) &&
  (!filters.action || entry.action === filters.action);

export function LiveFeed() {
  const { entries, lastSuccessAt, isLoading, isFailing, errorMessage, refetch } =
    useLiveFeed();
  const nowMilliseconds = useCurrentTime();

  const [filters, setFilters] = useState<FeedFilterValues>(emptyFilters);
  const [heldEntries, setHeldEntries] = useState<LiveFeedEntry[] | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const isFollowing = heldEntries === null;
  const visibleEntries = heldEntries ?? entries;

  const heldEntryIds = useMemo(
    () => new Set((heldEntries ?? []).map((entry) => entry.id)),
    [heldEntries],
  );

  const withheldCount =
    heldEntries === null
      ? 0
      : entries.filter((entry) => !heldEntryIds.has(entry.id)).length;

  const filteredEntries = useMemo(
    () => visibleEntries.filter((entry) => matchesFilters(entry, filters)),
    [visibleEntries, filters],
  );

  const recentEntryCount = useMemo(
    () =>
      entries.filter(
        (entry) =>
          nowMilliseconds - new Date(entry.createdAt).getTime() <=
          RECENT_WINDOW_MS,
      ).length,
    [entries, nowMilliseconds],
  );

  const pipelineOptions = useMemo(
    () => sortedUniqueValues(entries.map((entry) => entry.pipeline)),
    [entries],
  );
  const actorOptions = useMemo(
    () => sortedUniqueValues(entries.map((entry) => entry.actor)),
    [entries],
  );
  const actionOptions = useMemo(
    () => sortedUniqueValues(entries.map((entry) => entry.action)),
    [entries],
  );

  const holdFeed = () => setHeldEntries(entries);

  const resumeFeed = () => {
    setHeldEntries(null);
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleScroll = () => {
    const container = scrollContainerRef.current;

    if (!container) {
      return;
    }

    if (container.scrollTop > FOLLOW_SCROLL_THRESHOLD_PX) {
      if (isFollowing) {
        holdFeed();
      }

      return;
    }

    if (!isFollowing) {
      setHeldEntries(null);
    }
  };

  const millisecondsSinceLastSuccess =
    lastSuccessAt === null ? null : nowMilliseconds - lastSuccessAt;
  const isStale =
    millisecondsSinceLastSuccess !== null &&
    millisecondsSinceLastSuccess > LIVE_FEED_STALE_AFTER_MS;

  const connectionState = isFailing
    ? "failing"
    : lastSuccessAt === null
      ? "connecting"
      : isStale
        ? "stale"
        : "live";

  const connectionCopy = {
    live: "Live",
    connecting: "Connecting",
    stale: "Stale feed",
    failing: "Poll failed",
  }[connectionState];

  const connectionTone = {
    live: "text-brand-emerald-readable",
    connecting: "text-muted-foreground",
    stale: "text-destructive",
    failing: "text-destructive",
  }[connectionState];

  const connectionDot = {
    live: "bg-brand-emerald",
    connecting: "bg-muted-foreground",
    stale: "bg-destructive",
    failing: "bg-destructive",
  }[connectionState];

  if (isLoading) {
    return <LoadingSkeleton shape="row-list" count={8} />;
  }

  if (isFailing && entries.length === 0) {
    return (
      <ErrorState
        heading="The live feed is unreachable"
        message={errorMessage}
        onRetry={() => {
          refetch();
        }}
      />
    );
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4">
          <span className={cn("flex items-center gap-2 text-sm font-medium", connectionTone)}>
            <span className="relative flex size-2">
              {connectionState === "live" ? (
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand-emerald/60" />
              ) : null}
              <span className={cn("relative inline-flex size-2 rounded-full", connectionDot)} />
            </span>
            {connectionCopy}
          </span>

          <span className="text-sm text-muted-foreground">
            {countLabel(recentEntryCount, "event")} in the last 5 minutes
          </span>

          <span className="text-sm text-muted-foreground">
            {countLabel(entries.length, "event")} streamed
          </span>
        </div>

        <button
          type="button"
          onClick={isFollowing ? holdFeed : resumeFeed}
          className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-border px-2.5 text-xs font-medium transition-colors duration-200 hover:bg-muted"
        >
          {isFollowing ? (
            <>
              <Pause className="size-3.5" />
              Pause
            </>
          ) : (
            <>
              <Play className="size-3.5" />
              Resume
            </>
          )}
        </button>
      </div>

      <FeedFilters
        values={filters}
        pipelineOptions={pipelineOptions}
        actorOptions={actorOptions}
        actionOptions={actionOptions}
        onChange={setFilters}
      />

      {connectionState === "stale" || connectionState === "failing" ? (
        <p className="rounded-xl border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {connectionState === "failing"
            ? `Polling failed: ${errorMessage}. Retrying every ${LIVE_FEED_POLL_INTERVAL_MS / 1000} seconds.`
            : `No successful poll for ${
                millisecondsSinceLastSuccess === null
                  ? "a while"
                  : `${Math.round(millisecondsSinceLastSuccess / 1000)} seconds`
              }. The feed may be behind.`}
        </p>
      ) : null}

      {entries.length === 0 ? (
        <EmptyState
          icon={Inbox}
          heading="No activity yet"
          body="Nothing has run through a pipeline yet. Fire a case from the Simulator and it will appear here within a couple of seconds."
          action={
            <Link
              href="/simulator"
              className="inline-flex h-9 cursor-pointer items-center rounded-xl bg-foreground px-4 text-sm font-medium text-background transition-opacity duration-200 hover:opacity-90 dark:bg-gradient-to-r dark:from-brand-indigo dark:to-brand-emerald dark:text-white"
            >
              Open the Simulator
            </Link>
          }
        />
      ) : (
        <div className="relative">
          <AnimatePresence>
            {withheldCount > 0 ? (
              <motion.button
                key="new-entries"
                type="button"
                onClick={resumeFeed}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-x-0 top-3 z-10 mx-auto flex w-fit cursor-pointer items-center gap-1.5 rounded-full border border-border bg-background/90 px-3 py-1.5 text-xs font-medium shadow-lg backdrop-blur-md"
              >
                <ArrowUp className="size-3.5" />
                {countLabel(withheldCount, "new event")}
              </motion.button>
            ) : null}
          </AnimatePresence>

          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="max-h-[65vh] overflow-y-auto overscroll-contain rounded-xl border border-border [overflow-anchor:none]"
          >
            {filteredEntries.length === 0 ? (
              <EmptyState
                icon={SearchX}
                heading="No events match these filters"
                body="Nothing that has streamed in so far matches the current pipeline, actor and action selection."
                className="border-0"
                action={
                  <button
                    type="button"
                    onClick={() => setFilters(emptyFilters)}
                    className="inline-flex h-9 cursor-pointer items-center rounded-xl border border-border px-3 text-sm font-medium transition-colors duration-200 hover:bg-muted"
                  >
                    Clear filters
                  </button>
                }
              />
            ) : (
              <ol>
                <AnimatePresence initial={false}>
                  {filteredEntries.map((entry) => (
                    <LiveFeedRow
                      key={entry.id}
                      entry={{
                        id: entry.id,
                        actor: entry.actor,
                        action: entry.action,
                        detail: entry.detail,
                        createdAt: entry.createdAt,
                        pipeline: entry.pipeline,
                        customerName: entry.customerName,
                        caseId:
                          entry.entityType === "RecoveryCase"
                            ? entry.entityId
                            : null,
                      }}
                      nowMilliseconds={nowMilliseconds}
                    />
                  ))}
                </AnimatePresence>
              </ol>
            )}
          </div>

          {!isFollowing ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Feed held while you read. New events are counted above and appear
              when you resume.
              {lastSuccessAt === null
                ? null
                : ` Last poll ${formatRelativeTime(new Date(lastSuccessAt).toISOString(), nowMilliseconds)}.`}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
