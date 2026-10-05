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
import { BenchmarkMark } from "./benchmark-mark";
import { CONTAINER, H2, H2_SUB, H3_TITLE, SECTION } from "./type";

export function AboutLivful() {
  return (
    <section
      id="about"
      aria-labelledby="about-heading"
      className={`${SECTION} survey-grid bg-bg-deep`}
    >
      <div className={`${CONTAINER} space-y-16`}>
        <h2 id="about-heading" className={H2}>
          {ABOUT.heading.text}
        </h2>
        <div className="grid gap-x-16 gap-y-12 md:grid-cols-2">
          <div className="space-y-5 border-t-2 border-fg pt-6">
            <h3 className={H2_SUB}>{MISSION_HEADING.text}</h3>
            <p className="max-w-[44ch] text-xl leading-snug text-fg-muted">{MISSION.text}</p>
          </div>
          <div className="space-y-5 border-t-2 border-fg pt-6">
            <h3 className={H2_SUB}>{VISION_HEADING.text}</h3>
            <p className="max-w-[44ch] text-xl leading-snug text-fg-muted">{VISION.text}</p>
          </div>
        </div>
        <div className="space-y-6">
          <h3 className={H3_TITLE}>{APPROACH_HEADING.text}</h3>
          <ul role="list" className="grid gap-x-10 gap-y-8 md:grid-cols-3">
            {APPROACH.map((item) => (
              <li
                key={item.id}
                className="flex gap-4 border-t border-fg pt-5 leading-relaxed text-fg-muted"
              >
                <BenchmarkMark className="size-6 shrink-0 text-fg" />
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
          <p className="max-w-[70ch] text-sm leading-relaxed text-fg-muted">{APPROACH_NOTE.text}</p>
        </div>
      </div>
    </section>
  );
}
