import { HERO_SVG_ID } from "./constants";
import { HeroDiagramFooter, TogglePlaceholder } from "./hero-diagram-footer";
import { EcosystemSvg } from "./ecosystem-svg";
import { StaticPart } from "./static-part";

// The server-rendered layer: a complete diagram plus the footer the interactive layer matches, so the
// swap changes no geometry.
export function HeroStatic() {
  return (
    <>
      <div className="eco-frame">
        <EcosystemSvg Part={StaticPart} svgId={HERO_SVG_ID} />
      </div>
      <HeroDiagramFooter toggle={<TogglePlaceholder />} />
    </>
  );
}
