import type { PersonaId } from "@/lib/personas";

/** Switches the current session's persona through the BFF; true when it succeeded. */
export async function switchPersona(persona: PersonaId): Promise<boolean> {
  const response = await fetch("/api/demo/sessions/persona", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ persona }),
  }).catch(() => undefined);
  return response?.ok === true;
}
