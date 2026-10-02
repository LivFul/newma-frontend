import { type PersonaId, isPersonaId, personaLabel } from "@/lib/personas";

export const allowedLabels = (allowed: readonly string[]): string =>
  allowed.map((p) => (isPersonaId(p) ? personaLabel(p) : p)).join(", ");

/** UI hint only: the backend 403 persona_forbidden stays the authority. */
export function PersonaForbiddenNotice({ allowed }: { allowed: readonly PersonaId[] }) {
  return (
    <p role="note" className="text-sm text-fg-muted">
      Only {allowedLabels(allowed)} can do this. Switch persona in the header.
    </p>
  );
}
