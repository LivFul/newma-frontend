import { PERSONAS } from "@/content/home/personas";

export function PersonaGrid() {
  return (
    <ul className="grid gap-x-8 gap-y-6 md:grid-cols-2 lg:grid-cols-4">
      {PERSONAS.map((persona) => (
        <li key={persona.role.id} className="space-y-2 border-t border-border pt-4">
          <p className="font-display text-lg">{persona.role.text}</p>
          <p className="text-fg-muted">{persona.need.text}</p>
        </li>
      ))}
    </ul>
  );
}
