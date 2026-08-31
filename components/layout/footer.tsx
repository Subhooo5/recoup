import Image from "next/image";
import Link from "next/link";

import { Separator } from "@/components/ui/separator";

const pipelineLinks = [
  { label: "Payment Degradation", href: "/simulator#payment-degradation" },
  { label: "Checkout Drop-off", href: "/simulator#checkout-drop-off" },
  { label: "Failed Subscription", href: "/simulator#failed-subscription" },
];

const socialLinks = [
  {
    label: "LinkedIn",
    href: "#",
    path: "M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29ZM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14Zm1.78 13.02H3.55V9h3.57v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0Z",
  },
  {
    label: "GitHub",
    href: "#",
    path: "M12 .5C5.73.5.5 5.73.5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.69-3.88-1.55-3.88-1.55-.52-1.33-1.28-1.68-1.28-1.68-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.47.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.58.23 2.76.12 3.05.74.81 1.18 1.84 1.18 3.1 0 4.42-2.69 5.4-5.25 5.68.41.36.78 1.07.78 2.16 0 1.56-.01 2.82-.01 3.2 0 .31.21.68.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z",
  },
  {
    label: "X",
    href: "#",
    path: "M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.41l-5.8-7.58-6.64 7.58H.46l8.6-9.83L0 1.15h7.59l5.24 6.93 6.07-6.93Zm-1.29 19.5h2.04L6.49 3.24H4.3l13.31 17.41Z",
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto w-full max-w-6xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-[1.6fr_1fr_1fr]">
          <div>
            <Link
              href="/"
              className="flex w-fit cursor-pointer items-center gap-2 transition-opacity duration-200 ease-out hover:opacity-80"
            >
              <Image
                src="/logo-icon.svg"
                alt=""
                width={26}
                height={26}
              />
              <span className="font-heading text-base font-semibold tracking-tight">
                Recoup
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              An AI agent platform that detects revenue at risk across payments,
              diagnoses each case, and executes a governed recovery.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium">Pipelines</h3>
            <ul className="mt-4 flex flex-col gap-3">
              {pipelineLinks.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="cursor-pointer text-sm text-muted-foreground transition-colors duration-200 ease-out hover:text-foreground"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-medium">Connect</h3>
            <ul className="mt-4 flex items-center gap-3">
              {socialLinks.map(({ label, href, path }) => (
                <li key={label}>
                  <a
                    href={href}
                    aria-label={label}
                    target="_blank"
                    rel="noreferrer"
                    className="flex size-9 cursor-pointer items-center justify-center rounded-[20] border border-border text-muted-foreground transition-all duration-200 ease-out hover:scale-105 hover:border-foreground/20 hover:text-foreground"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden
                      className="size-4"
                    >
                      <path d={path} />
                    </svg>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; 2026 Subhodeep Chatterjee.</p>
          <p>Made with &#10084;&#65039;&#8205;&#128293;  &amp;  &#9749;&#65039; for Razorpay Buildathon.</p>
        </div>
      </div>
    </footer>
  );
}
