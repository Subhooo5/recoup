import { Suspense } from "react";

import { PageShell } from "@/components/layout/page-shell";
import { LoadingSkeleton } from "@/components/data/loading-skeleton";
import { SimulatorForm } from "@/components/simulator/simulator-form";

export default function SimulatorPage() {
  return (
    <PageShell>
      <header className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Simulator
        </h1>
        <p className="mt-3 text-muted-foreground">
          Drive each recovery pipeline against real Razorpay infrastructure.
          Every mode creates real records and runs the full detect, diagnose,
          gate and execute loop.
        </p>
      </header>

      <div className="mt-10">
        <Suspense fallback={<LoadingSkeleton shape="row-list" count={5} />}>
          <SimulatorForm />
        </Suspense>
      </div>
    </PageShell>
  );
}
