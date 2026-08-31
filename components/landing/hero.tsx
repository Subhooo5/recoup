import { GetStartedButton } from "@/components/get-started-button";
import { GradientBorder } from "@/components/landing/gradient-border";

export function Hero() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 pt-36 pb-20">
      <GradientBorder>
        <div className="flex flex-col items-center gap-6 px-6 py-20 text-center sm:px-14">
          <span className="rounded-lg border border-border bg-muted/40 px-3 py-1 text-xs tracking-wide text-muted-foreground uppercase">
            AI Revenue Recovery
          </span>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl md:text-6xl">
            Revenue rarely disappears. It stalls.
          </h1>
          <p className="max-w-2xl text-base text-pretty text-muted-foreground sm:text-lg">
            Recoup runs three AI agent pipelines across your payment stack,
            watching for degrading gateways, abandoned checkouts, and failed
            subscription renewals. Every case is detected, diagnosed, and
            resolved with a governed recovery action, and every decision lands
            in an audit trail you can read back.
          </p>
          <GetStartedButton className="mt-2" />
        </div>
      </GradientBorder>
    </section>
  );
}
