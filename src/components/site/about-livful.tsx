import { ABOUT } from "@/content/home/copy";
import {
  APPROACH,
  APPROACH_HEADING,
  APPROACH_NOTE,
  MISSION,
  MISSION_HEADING,
  VISION,
  VISION_HEADING,
} from "@/content/home/about";

export function AboutLivful() {
  return (
    <section
      id="about"
      aria-labelledby="about-heading"
      className="border-t border-border py-12 md:py-16"
    >
      <div className="mx-auto max-w-6xl space-y-10 px-4 md:px-8">
        <h2 id="about-heading" className="font-display text-3xl tracking-tight text-balance">
          {ABOUT.heading.text}
        </h2>
        <div className="grid gap-x-12 gap-y-10 md:grid-cols-2">
          <div className="space-y-3">
            <h3 className="text-xl font-semibold">{MISSION_HEADING.text}</h3>
            <p className="max-w-[58ch] font-display text-xl">{MISSION.text}</p>
          </div>
          <div className="space-y-3">
            <h3 className="text-xl font-semibold">{VISION_HEADING.text}</h3>
            <p className="max-w-[58ch] font-display text-xl">{VISION.text}</p>
          </div>
        </div>
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">{APPROACH_HEADING.text}</h3>
          <ul role="list" className="grid gap-x-8 gap-y-4 md:grid-cols-3">
            {APPROACH.map((item) => (
              <li key={item.id} className="border-t border-border pt-4 text-fg-muted">
                {item.text}
              </li>
            ))}
          </ul>
          <p className="max-w-[60ch] text-sm text-fg-muted">{APPROACH_NOTE.text}</p>
        </div>
      </div>
    </section>
  );
}
