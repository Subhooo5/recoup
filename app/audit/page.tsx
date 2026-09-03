import { AuditWorkspace } from "@/components/audit/audit-workspace";
import { PageShell } from "@/components/layout/page-shell";

export default function AuditPage() {
  return (
    <PageShell>
      <header className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Audit
        </h1>
        <p className="mt-3 text-muted-foreground">
          The complete ledger of everything the system has done, and the
          deterministic rules it had to satisfy first. Every agent step is
          recorded next to the policy decision that allowed or stopped it.
        </p>
      </header>

      <div className="mt-10">
        <AuditWorkspace />
      </div>
    </PageShell>
  );
}
