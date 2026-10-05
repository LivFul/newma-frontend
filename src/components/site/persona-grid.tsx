import { PERSONAS } from "@/content/home/personas";

// The survey party: a ruled roster, one column per role, each headed by a heavy ink rule.
export function PersonaGrid() {
  return (
    <ul role="list" className="grid gap-x-10 gap-y-10 md:grid-cols-2 lg:grid-cols-4">
      {PERSONAS.map((persona) => (
        <li key={persona.role.id} className="space-y-3 border-t-2 border-fg pt-5">
          <p className="text-xl font-medium tracking-[-0.01em]">{persona.role.text}</p>
          <p className="leading-relaxed text-fg-muted">{persona.need.text}</p>
        </li>
      ))}
    </ul>
  );
}
