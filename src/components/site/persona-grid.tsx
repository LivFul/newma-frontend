import { PERSONAS } from "@/content/home/personas";
import { CapsuleIcon } from "@/components/brand/capsule-icon";
import { REVEAL_CHILD } from "./type";

export function PersonaGrid() {
  return (
    <ul role="list" className="grid gap-x-10 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
      {PERSONAS.map((persona) => (
        <li
          key={persona.role.id}
          className={`${REVEAL_CHILD} space-y-3 rounded-lg border border-fg/[0.08] bg-bg-elevated p-5 shadow-sm`}
        >
          <div className="flex items-center gap-3">
            <CapsuleIcon className="size-6 shrink-0" />
            <p className="text-xl font-medium tracking-[-0.01em]">{persona.role.text}</p>
          </div>
          <p className="leading-relaxed text-fg-muted">{persona.need.text}</p>
        </li>
      ))}
    </ul>
  );
}
