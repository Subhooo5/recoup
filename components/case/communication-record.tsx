import { CircleCheck, CircleX, Mail } from "lucide-react";

import type { CaseDetailCommunication } from "@/lib/api/response-types";
import { channelLabel, communicationStatusLabel } from "@/lib/format/labels";
import { formatAbsoluteTime } from "@/lib/format/time";
import { cn } from "@/lib/utils";

type CommunicationRecordProps = {
  communications: CaseDetailCommunication[];
};

export function CommunicationRecord({
  communications,
}: CommunicationRecordProps) {
  if (communications.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No customer communication was recorded for this action.
      </p>
    );
  }

  return (
    <ul className="grid gap-2">
      {communications.map((communication) => {
        const wasSent = communication.status === "sent";

        return (
          <li
            key={communication.id}
            className={cn(
              "grid gap-1 rounded-xl border px-3 py-2.5",
              wasSent ? "border-border" : "border-destructive/40 bg-destructive/5",
            )}
          >
            <div className="flex flex-wrap items-center gap-2">
              <Mail className="size-4 shrink-0 text-muted-foreground" />
              <span className="text-sm font-medium">
                {channelLabel(communication.channel)}
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium",
                  wasSent
                    ? "border-brand-emerald/35 bg-brand-emerald/10 text-brand-emerald-readable"
                    : "border-destructive/45 bg-destructive/10 text-destructive",
                )}
              >
                {wasSent ? (
                  <CircleCheck className="size-3.5" />
                ) : (
                  <CircleX className="size-3.5" />
                )}
                {communicationStatusLabel(communication.status)}
              </span>
              <span className="ml-auto text-xs text-muted-foreground">
                {formatAbsoluteTime(communication.sentAt ?? communication.createdAt)}
              </span>
            </div>

            {communication.subject ? (
              <p className="pl-6 text-sm">{communication.subject}</p>
            ) : null}

            {communication.providerMessageId ? (
              <p className="pl-6 font-mono text-[11px] text-muted-foreground">
                {communication.providerMessageId}
              </p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
