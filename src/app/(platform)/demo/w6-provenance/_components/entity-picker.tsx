import Link from "next/link";
import { ENTITY_TYPES } from "@/lib/demo/types";
import { humanize } from "../../_components/fields";

export type EntityLink = Readonly<{ entityType: string; entityId: string; label: string }>;

const href = (link: EntityLink) =>
  `/demo/w6-provenance/${encodeURIComponent(link.entityType)}/${encodeURIComponent(link.entityId)}`;

export function EntityLinks({ title, links }: { title: string; links: readonly EntityLink[] }) {
  return (
    <section aria-label={title} className="space-y-2">
      <h3 className="text-lg font-semibold">{title}</h3>
      {links.length === 0 ? <p className="text-sm text-fg-muted">None yet.</p> : null}
      <ul className="grid list-none gap-1 p-0 text-sm">
        {links.map((link) => (
          <li key={`${link.entityType}:${link.entityId}`}>
            <Link href={href(link)} className="underline underline-offset-4">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Plain GET form for any entity by type and id (releases, work packages, agent queries…). */
export function EntityLookup() {
  return (
    <form
      method="get"
      action="/demo/w6-provenance"
      aria-label="Open an entity timeline"
      className="flex flex-wrap items-end gap-3"
    >
      <label className="flex flex-col gap-1 text-sm">
        Entity type
        <select
          name="type"
          className="min-h-10 rounded-md border border-border-strong bg-bg-elevated px-3"
        >
          {ENTITY_TYPES.map((type) => (
            <option key={type} value={type}>
              {humanize(type)}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Entity id
        <input
          name="id"
          autoComplete="off"
          className="min-h-10 rounded-md border border-border-strong bg-bg-elevated px-3"
        />
      </label>
      <button
        type="submit"
        className="min-h-10 rounded-md border border-border-strong bg-bg-elevated px-4"
      >
        Open timeline
      </button>
    </form>
  );
}
