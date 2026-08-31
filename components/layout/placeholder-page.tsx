import { PageShell } from "@/components/layout/page-shell";

type PlaceholderPageProps = {
  title: string;
};

export function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <PageShell className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        {title}
      </h1>
      <p className="mt-3 text-muted-foreground">
        Coming in the next build phase.
      </p>
    </PageShell>
  );
}
