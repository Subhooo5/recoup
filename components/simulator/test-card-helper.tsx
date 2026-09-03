"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

const testCards = [
  {
    label: "Declined card",
    number: "4100 2800 0006 0003",
    network: "Visa",
    note: "Documented by Razorpay to produce a card_declined failure.",
    emphasis: true,
  },
  {
    label: "Declined card, alternate",
    number: "5305 6200 0003 0003",
    network: "Mastercard",
    note: "Second documented declining card.",
    emphasis: false,
  },
  {
    label: "Successful card",
    number: "4100 2800 0000 1007",
    network: "Visa Debit",
    note: "Use only if you want the payment to succeed instead.",
    emphasis: false,
  },
];

export function TestCardHelper() {
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);

  const copyCardNumber = async (cardNumber: string) => {
    try {
      await navigator.clipboard.writeText(cardNumber.replace(/\s/g, ""));
      setCopiedNumber(cardNumber);
      window.setTimeout(() => setCopiedNumber(null), 1600);
    } catch {
      setCopiedNumber(null);
    }
  };

  return (
    <div className="rounded-xl border border-border p-4">
      <h3 className="font-heading text-sm font-semibold">Razorpay test cards</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Use any random CVV and any future expiry date. Razorpay test mode then
        shows a mock page where you choose success or failure.
      </p>

      <ul className="mt-3 grid gap-2">
        {testCards.map((card) => (
          <li
            key={card.number}
            className={
              card.emphasis
                ? "rounded-xl border border-brand-indigo/40 bg-brand-indigo/5 p-3"
                : "rounded-xl border border-border p-3"
            }
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium">
                  {card.label}
                  <span className="ml-2 font-normal text-muted-foreground">
                    {card.network}
                  </span>
                </p>
                <p className="mt-0.5 font-mono text-sm">{card.number}</p>
              </div>
              <button
                type="button"
                onClick={() => copyCardNumber(card.number)}
                aria-label={`Copy ${card.label}`}
                className="cursor-pointer rounded-xl border border-border p-2 transition-colors duration-200 hover:border-brand-indigo/50"
              >
                {copiedNumber === card.number ? (
                  <Check className="size-4 text-brand-emerald" />
                ) : (
                  <Copy className="size-4 text-muted-foreground" />
                )}
              </button>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{card.note}</p>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-xs text-muted-foreground">
        Source: Razorpay test card documentation at
        razorpay.com/docs/payments/payments/test-card-details
      </p>
    </div>
  );
}
