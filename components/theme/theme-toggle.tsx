"use client";

import { Moon, Sun } from "lucide-react";
import { motion } from "motion/react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";

const themeOptions = [
  { value: "light", label: "Use light theme", Icon: Sun },
  { value: "dark", label: "Use dark theme", Icon: Moon },
];

const subscribeToMount = () => () => {};
const getMountedOnClient = () => true;
const getMountedOnServer = () => false;

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isMounted = useSyncExternalStore(
    subscribeToMount,
    getMountedOnClient,
    getMountedOnServer,
  );

  return (
    <div className="flex items-center gap-1 rounded-2xl border border-border bg-muted/40 p-1">
      {themeOptions.map(({ value, label, Icon }) => {
        const isActive = isMounted && resolvedTheme === value;

        return (
          <button
            key={value}
            type="button"
            aria-label={label}
            aria-pressed={isActive}
            onClick={() => setTheme(value)}
            className={cn(
              "relative flex size-7 cursor-pointer items-center justify-center rounded-full transition-colors duration-200 ease-out",
              isActive
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {isActive ? (
              <motion.span
                layoutId="theme-toggle-indicator"
                className="absolute inset-0 rounded-full bg-background shadow-sm"
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              />
            ) : null}
            <Icon className="relative size-4" />
          </button>
        );
      })}
    </div>
  );
}
