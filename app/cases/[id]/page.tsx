import { CaseDetail } from "@/components/case/case-detail";
import { PageShell } from "@/components/layout/page-shell";

export default async function CaseDetailPage({
  params,
}: PageProps<"/cases/[id]">) {
  const { id } = await params;

  return (
    <PageShell>
      <CaseDetail caseId={id} />
    </PageShell>
  );
}
