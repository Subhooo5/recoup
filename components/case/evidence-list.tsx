import { Dot } from "lucide-react";

type EvidenceListProps = {
  evidence: string[];
};

export function EvidenceList({ evidence }: EvidenceListProps) {
  if (evidence.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        The agent recorded no evidence entries for this diagnosis.
      </p>
    );
  }

  return (
    <ul className="grid gap-1.5">
      {evidence.map((entry) => (
        <li key={entry} className="flex items-start gap-1.5 text-sm">
          <Dot className="mt-0.5 size-4 shrink-0 text-brand-indigo" />
          <span className="text-muted-foreground">{entry}</span>
        </li>
      ))}
    </ul>
  );
}
