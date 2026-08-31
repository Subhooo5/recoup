import { PlaceholderPage } from "@/components/layout/placeholder-page";

export default async function CaseDetailPage({
  params,
}: PageProps<"/cases/[id]">) {
  const { id } = await params;

  return <PlaceholderPage title={`Case ${id}`} />;
}
