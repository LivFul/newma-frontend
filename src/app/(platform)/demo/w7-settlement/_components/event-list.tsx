import Link from "next/link";
import type { ProvenanceEvent } from "@/lib/demo/types";
import { isPersonaId, personaLabel } from "@/lib/personas";
import { formatInstant } from "../../_components/fields";
import { SimulatedLabel } from "../../_components/simulated-label";

type Props = Readonly<{ events: readonly ProvenanceEvent[]; emptyText?: string }>;

const actor = (persona: string) => (isPersonaId(persona) ? personaLabel(persona) : persona);

/** Signed events of a license or settlement; each links to the W6 single-event verification page. */
export function EventList({ events, emptyText = "No signed events recorded." }: Props) {
  if (events.length === 0) return <p className="text-sm text-fg-muted">{emptyText}</p>;
  return (
    <ol aria-label="Signed events" className="space-y-2">
      {[...events]
        .sort((a, b) => a.seq - b.seq)
        .map((event) => (
          <li
            key={event.id}
            data-seq={event.seq}
            data-event-type={event.event_type}
            className="space-y-1 rounded-md border border-border p-3 text-sm"
          >
            <p className="flex flex-wrap items-baseline gap-2">
              <span className="font-mono">#{event.seq}</span>
              <span className="font-semibold">{event.event_type}</span>
              <span>{actor(event.actor_persona)}</span>
              <span className="text-fg-muted">{formatInstant(event.occurred_at)}</span>
            </p>
            <p className="flex flex-wrap items-center gap-2">
              <SimulatedLabel label="Demo signature, not production key" />
              <span className="text-fg-muted">Key id {event.kid}</span>
              <Link
                href={`/demo/w6-provenance/events/${encodeURIComponent(event.id)}`}
                className="underline underline-offset-4"
              >
                Verify event {event.seq} in W6
              </Link>
            </p>
          </li>
        ))}
    </ol>
  );
}
