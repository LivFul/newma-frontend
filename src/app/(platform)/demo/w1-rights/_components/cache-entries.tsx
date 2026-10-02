import { Badge } from "@/components/ui";
import type { CacheEntry } from "@/lib/demo/types";
import { formatInstant, humanize } from "../../_components/fields";

/** Retrieval cache entries with their invalidation state (Review Focus 1). */
export function CacheEntries({ entries }: { entries: readonly CacheEntry[] }) {
  if (entries.length === 0) return <p className="text-fg-muted">No cached retrievals yet.</p>;
  return (
    <ul className="grid list-none gap-2 p-0" aria-label="Retrieval cache entries">
      {entries.map((entry) => (
        <li
          key={entry.id}
          className="flex flex-wrap items-center gap-3 rounded-md border border-border px-3 py-2 text-sm"
        >
          <span className="font-mono text-xs">{entry.id.slice(0, 8)}</span>
          <span>{humanize(entry.purpose)}</span>
          <span className="text-fg-muted">created {formatInstant(entry.created_at)}</span>
          <Badge
            tone={entry.invalidated_at ? "danger" : "success"}
            data-testid={`cache-state-${entry.id}`}
            data-invalidated={entry.invalidated_at ? "true" : "false"}
          >
            {entry.invalidated_at
              ? `Invalidated: ${entry.invalidation_reason ?? "unspecified"}`
              : "Active"}
          </Badge>
          {entry.invalidated_at ? (
            <span className="text-fg-muted">at {formatInstant(entry.invalidated_at)}</span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
