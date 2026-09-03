"use client";

import { useEffect, useState } from "react";

const RAZORPAY_CHECKOUT_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

type RazorpayCheckoutOptions = {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description: string;
  prefill: { name: string; email: string };
  modal: { ondismiss: () => void };
  handler: () => void;
};

type RazorpayCheckoutConstructor = new (options: RazorpayCheckoutOptions) => {
  open: () => void;
};

type RazorpayWindow = Window & { Razorpay?: RazorpayCheckoutConstructor };

export type RazorpayOrderHandoff = {
  orderId: string;
  amount: number;
  currency: string;
  razorpayKeyId: string;
  customer: { name: string; email: string };
};

const loadCheckoutScript = () =>
  new Promise<RazorpayCheckoutConstructor>((resolve, reject) => {
    const razorpayWindow = window as RazorpayWindow;

    if (razorpayWindow.Razorpay) {
      resolve(razorpayWindow.Razorpay);
      return;
    }

    const script = document.createElement("script");
    script.src = RAZORPAY_CHECKOUT_SCRIPT;
    script.async = true;
    script.onload = () => {
      if (razorpayWindow.Razorpay) {
        resolve(razorpayWindow.Razorpay);
      } else {
        reject(new Error("Razorpay Checkout did not initialise"));
      }
    };
    script.onerror = () => reject(new Error("Razorpay Checkout failed to load"));
    document.body.appendChild(script);
  });

type RazorpayCheckoutEmbedProps = {
  handoff: RazorpayOrderHandoff;
};

export function RazorpayCheckoutEmbed({ handoff }: RazorpayCheckoutEmbedProps) {
  const [status, setStatus] = useState<"opening" | "open" | "dismissed" | "error">(
    "opening",
  );
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const openCheckout = async () => {
      try {
        const RazorpayCheckout = await loadCheckoutScript();

        if (cancelled) {
          return;
        }

        const checkout = new RazorpayCheckout({
          key: handoff.razorpayKeyId,
          amount: handoff.amount,
          currency: handoff.currency,
          order_id: handoff.orderId,
          name: "Recoup",
          description: "Simulated failing payment",
          prefill: {
            name: handoff.customer.name,
            email: handoff.customer.email,
          },
          modal: { ondismiss: () => setStatus("dismissed") },
          handler: () => setStatus("dismissed"),
        });

        checkout.open();
        setStatus("open");
      } catch (error) {
        if (!cancelled) {
          setStatus("error");
          setErrorDetail(
            error instanceof Error ? error.message : "Unknown Checkout error",
          );
        }
      }
    };

    openCheckout();

    return () => {
      cancelled = true;
    };
  }, [handoff]);

  return (
    <div className="rounded-xl border border-border p-4">
      <h3 className="font-heading text-sm font-semibold">Razorpay Checkout</h3>
      <p className="mt-1 font-mono text-xs text-muted-foreground">
        {handoff.orderId}
      </p>

      {status === "opening" ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Loading Razorpay Checkout…
        </p>
      ) : null}

      {status === "open" ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Checkout is open. Pay with the declined card to make Razorpay fire a
          real payment.failed webhook.
        </p>
      ) : null}

      {status === "dismissed" ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Checkout closed. If the payment failed, Razorpay sends the webhook
          within a few seconds and the run below will pick it up.
        </p>
      ) : null}

      {status === "error" ? (
        <p className="mt-3 text-sm text-destructive">
          {errorDetail ?? "Razorpay Checkout could not be opened."}
        </p>
      ) : null}
    </div>
  );
}
