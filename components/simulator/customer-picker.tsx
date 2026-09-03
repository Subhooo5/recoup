"use client";

import { useEffect, useState } from "react";

export type SimulatorCustomer = {
  id: string;
  name: string;
  email: string;
};

type CustomerPickerProps = {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
};

export function CustomerPicker({
  value,
  onChange,
  disabled,
}: CustomerPickerProps) {
  const [customers, setCustomers] = useState<SimulatorCustomer[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">(
    "loading",
  );

  useEffect(() => {
    let cancelled = false;

    const loadCustomers = async () => {
      try {
        const response = await fetch("/api/customers");

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const body = (await response.json()) as { items: SimulatorCustomer[] };

        if (cancelled) {
          return;
        }

        setCustomers(body.items);
        setLoadState("ready");

        if (!value && body.items.length > 0) {
          onChange(body.items[0].id);
        }
      } catch {
        if (!cancelled) {
          setLoadState("error");
        }
      }
    };

    loadCustomers();

    return () => {
      cancelled = true;
    };
  }, [onChange, value]);

  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium">Customer</span>

      {loadState === "loading" ? (
        <span className="h-10 animate-pulse rounded-xl bg-muted" />
      ) : null}

      {loadState === "error" ? (
        <span className="rounded-xl border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          Could not load customers. Refresh to try again.
        </span>
      ) : null}

      {loadState === "ready" && customers.length === 0 ? (
        <span className="rounded-xl border border-border px-3 py-2 text-sm text-muted-foreground">
          No customers exist yet. Seed the database first.
        </span>
      ) : null}

      {loadState === "ready" && customers.length > 0 ? (
        <select
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 cursor-pointer rounded-xl border border-input bg-background px-3 text-sm transition-colors duration-200 focus:border-brand-indigo focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
        >
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.name} — {customer.email}
            </option>
          ))}
        </select>
      ) : null}

      <span className="text-xs text-muted-foreground">
        Recovery mail is sent to this address, so pick an inbox you can open.
      </span>
    </label>
  );
}
