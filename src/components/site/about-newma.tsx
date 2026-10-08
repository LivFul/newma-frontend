import { ABOUT } from "@/content/home/copy";
import {
  APPROACH,
  APPROACH_HEADING,
  MISSION,
  MISSION_HEADING,
  PURPOSE,
  PURPOSE_LEDE,
  VISION,
  VISION_HEADING,
} from "@/content/home/about";
import { CapsuleIcon } from "@/components/brand/capsule-icon";
import { CONTAINER, H2, H2_SUB, H3_TITLE, SECTION } from "./type";

export function AboutNewma() {
  return (
    <section
      id="about"
      aria-labelledby="about-heading"
      className={`${SECTION} bg-peach`}
      data-reveal
    >
      <div className={`${CONTAINER} space-y-(--space-16)`}>
        <div className="space-y-4">
          <h2 id="about-heading" className={H2}>
            {ABOUT.heading.text}
          </h2>
          <p className="max-w-[44ch] text-xl font-medium tracking-[-0.01em] text-fg-muted">
            {ABOUT.subheading.text}
          </p>
        </div>
        <div
          className="h-40 rounded-lg bg-cover bg-center opacity-80 shadow-sm md:h-52"
          style={{
            backgroundImage:
              'image-set(url("/images/field-plants.webp") type("image/webp"), url("/images/field-plants.jpg") type("image/jpeg"))',
          }}
          aria-hidden="true"
        />
        {/* Same two-column grid as Mission and Vision below, so the columns align down the section. */}
        <div data-about-purpose className="grid items-start gap-x-16 gap-y-6 md:grid-cols-2">
          <p className="text-xl leading-snug text-fg-muted">{PURPOSE_LEDE.text}</p>
          <p className="text-lg leading-relaxed text-fg-muted">{PURPOSE.text}</p>
        </div>
        <div className="grid gap-x-16 gap-y-12 md:grid-cols-2">
          <div className="space-y-5 rounded-lg bg-bg-elevated/80 p-6 shadow-sm">
            <h3 className={H2_SUB}>{MISSION_HEADING.text}</h3>
            <p className="max-w-[44ch] text-xl leading-snug text-fg-muted">{MISSION.text}</p>
          </div>
          <div className="space-y-5 rounded-lg bg-bg-elevated/80 p-6 shadow-sm">
            <h3 className={H2_SUB}>{VISION_HEADING.text}</h3>
            <p className="max-w-[44ch] text-xl leading-snug text-fg-muted">{VISION.text}</p>
          </div>
        </div>
        <div className="space-y-6">
          <h3 className={H3_TITLE}>{APPROACH_HEADING.text}</h3>
          <ul role="list" className="grid gap-x-10 gap-y-8 md:grid-cols-2 lg:grid-cols-3">
            {APPROACH.map((item) => (
              <li key={item.title.id} className="flex gap-4 leading-relaxed text-fg-muted">
                <CapsuleIcon className="mt-0.5 size-6 shrink-0" />
                <span>
                  <strong className="font-medium text-fg">{item.title.text}</strong>{" "}
                  {item.text.text}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
