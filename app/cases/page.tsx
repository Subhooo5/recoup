import { Suspense } from "react";

import { CaseFilters } from "@/components/case/case-filters";
import { CaseTable } from "@/components/case/case-table";
import { LoadingSkeleton } from "@/components/data/loading-skeleton";
import { PageShell } from "@/components/layout/page-shell";

export default function CasesPage() {
  return (
    <PageShell>
      <header className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Cases
        </h1>
        <p className="mt-3 text-muted-foreground">
          Every recovery case the three pipelines have opened, with the agent
          diagnosis and the outcome the policy gate allowed. Filters are held in
          the URL, so any view here is a link you can share.
        </p>
      </header>

      <Suspense fallback={<LoadingSkeleton shape="row-list" count={8} className="mt-10" />}>
        <div className="mt-10 grid gap-4">
          <CaseFilters />
          <CaseTable />
        </div>
      </Suspense>
    </PageShell>
  );
}
