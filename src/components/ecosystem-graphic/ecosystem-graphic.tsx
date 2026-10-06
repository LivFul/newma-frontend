import { HERO_CAPTION } from "@/content/home/hero-caption";
import { ECOSYSTEM_SLUGS, HERO_LABELS, ecosystemHref } from "@/content/ecosystem/registry";
import { HeroLoader } from "./hero-loader";
import { HeroStatic } from "./hero-static";
import { KeyboardHelp } from "./keyboard-help";
import "./ecosystem-graphic.css";

export function EcosystemGraphic() {
  return (
    <figure className="eco-figure" data-hero>
      <HeroLoader>
        <HeroStatic />
      </HeroLoader>
      <ul className="eco-fallback leaf-list px-2 pb-4 text-sm" aria-hidden="true">
        {ECOSYSTEM_SLUGS.map((slug) => (
          <li key={slug}>
            <a href={ecosystemHref(slug)} className="text-accent underline">
              {HERO_LABELS[slug].title}
            </a>
            <span className="text-fg-muted"> — {HERO_LABELS[slug].descriptor}</span>
          </li>
        ))}
      </ul>
      <KeyboardHelp />
      <figcaption className="mx-auto max-w-[34rem] pb-2 text-sm text-fg-muted">
        {HERO_CAPTION.text}
      </figcaption>
    </figure>
  );
}
