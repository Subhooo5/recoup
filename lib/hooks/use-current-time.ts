"use client";

import { useSyncExternalStore } from "react";

const TICK_INTERVAL_MS = 1000;

const initialTick = Date.now();

let currentTick = initialTick;
let tickTimer: ReturnType<typeof setInterval> | null = null;

const listeners = new Set<() => void>();

const subscribeToTick = (listener: () => void) => {
  listeners.add(listener);

  if (tickTimer === null) {
    currentTick = Date.now();
    tickTimer = setInterval(() => {
      currentTick = Date.now();
      listeners.forEach((notify) => notify());
    }, TICK_INTERVAL_MS);
  }

  return () => {
    listeners.delete(listener);

    if (listeners.size === 0 && tickTimer !== null) {
      clearInterval(tickTimer);
      tickTimer = null;
    }
  };
};

const getTick = () => currentTick;
const getInitialTick = () => initialTick;

export const useCurrentTime = () =>
  useSyncExternalStore(subscribeToTick, getTick, getInitialTick);
