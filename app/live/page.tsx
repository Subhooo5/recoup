import { PageShell } from "@/components/layout/page-shell";
import { LiveFeed } from "@/components/live/live-feed";

export default function LivePage() {
  return (
    <PageShell>
      <header className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Live
        </h1>
        <p className="mt-3 text-muted-foreground">
          Every audit entry as the pipelines write it, polled from the ledger
          every 2.5 seconds. Agent reasoning is marked apart from deterministic
          system steps, and each row expands to the exact JSON that was
          recorded.
        </p>
      </header>

      <div className="mt-10">
        <LiveFeed />
      </div>
    </PageShell>
  );
}
