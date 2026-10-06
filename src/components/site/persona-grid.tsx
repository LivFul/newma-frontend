import { PERSONAS } from "@/content/home/personas";
import { LeafIcon } from "@/components/brand/leaf-icon";

export function PersonaGrid() {
  return (
    <ul role="list" className="grid gap-x-10 gap-y-10 md:grid-cols-2 lg:grid-cols-4">
      {PERSONAS.map((persona) => (
        <li
          key={persona.role.id}
          className="space-y-3 rounded-xl border border-border/70 bg-bg-elevated p-5 shadow-sm"
        >
          <LeafIcon className="h-6 w-auto" />
          <p className="text-xl font-medium tracking-[-0.01em]">{persona.role.text}</p>
          <p className="leading-relaxed text-fg-muted">{persona.need.text}</p>
        </li>
      ))}
    </ul>
  );
}
