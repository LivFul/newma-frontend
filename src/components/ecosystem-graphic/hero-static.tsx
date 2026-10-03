import { HERO_HINT_STATIC } from "@/content/home/hero-help";
import { HERO_SVG_ID } from "./constants";
import { EcosystemSvg } from "./ecosystem-svg";
import { StaticPart } from "./static-part";

// The server-rendered layer: a complete diagram plus the fixed-height hint row that the interactive
// layer replaces with its toggle row, so the swap changes no geometry.
export function HeroStatic() {
  return (
    <>
      <div className="eco-frame">
        <EcosystemSvg Part={StaticPart} svgId={HERO_SVG_ID} />
      </div>
      <div className="eco-controls mx-auto flex min-h-11 max-w-[34rem] items-center">
        <p className="text-sm text-fg-muted">{HERO_HINT_STATIC.text}</p>
      </div>
    </>
  );
}
