import Link from "next/link";
import type { ProvenanceEvent } from "@/lib/demo/types";
import { isPersonaId, personaLabel } from "@/lib/personas";
import { formatInstant } from "../../_components/fields";

type Props = Readonly<{
  events: readonly ProvenanceEvent[];
  entityType: string;
  entityId: string;
  selected: string | undefined;
}>;

const actor = (persona: string) => (isPersonaId(persona) ? personaLabel(persona) : persona);

/** Append-only: events are listed by seq and can be inspected, never edited or deleted. */
export function EventTimeline({ events, entityType, entityId, selected }: Props) {
  if (events.length === 0) return <p className="text-fg-muted">No events recorded.</p>;
  const base = `/demo/w6-provenance/${encodeURIComponent(entityType)}/${encodeURIComponent(entityId)}`;
  return (
    <ol aria-label="Event timeline" className="space-y-2">
      {[...events]
        .sort((a, b) => a.seq - b.seq)
        .map((event) => (
          <li
            key={event.id}
            data-seq={event.seq}
            data-event-type={event.event_type}
            aria-current={event.id === selected ? "true" : undefined}
            className="space-y-1 rounded-md border border-border p-3 text-sm aria-[current=true]:border-accent"
          >
            <p className="flex flex-wrap items-baseline gap-2">
              <span className="font-mono">#{event.seq}</span>
              <span className="font-semibold">{event.event_type}</span>
              <span>{actor(event.actor_persona)}</span>
              <span className="text-fg-muted">authority {event.authority}</span>
            </p>
            <p className="text-fg-muted">
              {formatInstant(event.occurred_at)} · policy {event.policy_version} · entity v
              {event.entity_version}
            </p>
            <Link
              href={`${base}?event=${encodeURIComponent(event.id)}`}
              className="underline underline-offset-4"
            >
              Inspect event {event.seq}
            </Link>
          </li>
        ))}
    </ol>
  );
}
