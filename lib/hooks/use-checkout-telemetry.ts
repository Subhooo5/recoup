"use client";

import { useCallback } from "react";

export type CheckoutStartedTelemetry = {
  razorpayOrderId: string;
  cartValue?: number;
  itemsSummary?: string;
  paymentMethodSelected?: string;
  frontendSessionId?: string;
};

export const useCheckoutTelemetry = () =>
  useCallback((telemetry: CheckoutStartedTelemetry) => {
    void fetch("/api/telemetry/checkout-started", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(telemetry),
      keepalive: true,
    }).catch(() => undefined);
  }, []);
