import { HERO_CAPTION } from "@/content/home/hero-caption";
import { HERO_HINT_STATIC } from "@/content/home/hero-help";
import { EcosystemSvg } from "./ecosystem-svg";
import { StaticPart } from "./static-part";
import "./ecosystem-graphic.css";

export const HERO_SVG_ID = "eco-hero";

// Server component: a complete, working diagram with zero client JavaScript.
export function EcosystemGraphic() {
  return (
    <figure className="eco-figure" data-hero>
      <div className="eco-frame">
        <EcosystemSvg Part={StaticPart} svgId={HERO_SVG_ID} />
      </div>
      <div className="mx-auto flex min-h-11 max-w-[34rem] items-center">
        <p className="text-sm text-fg-muted">{HERO_HINT_STATIC.text}</p>
      </div>
      <figcaption className="mx-auto max-w-[34rem] text-sm text-fg-muted">
        {HERO_CAPTION.text}
      </figcaption>
    </figure>
  );
}
