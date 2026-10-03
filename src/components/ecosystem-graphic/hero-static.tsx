import { HERO_SVG_ID } from "./constants";
import { ControlsRow, TogglePlaceholder } from "./controls-row";
import { EcosystemSvg } from "./ecosystem-svg";
import { StaticPart } from "./static-part";

// The server-rendered layer: a complete diagram plus the controls row that the interactive layer
// fills with its toggle, so the swap changes no geometry.
export function HeroStatic() {
  return (
    <>
      <div className="eco-frame">
        <EcosystemSvg Part={StaticPart} svgId={HERO_SVG_ID} />
      </div>
      <ControlsRow>
        <TogglePlaceholder />
      </ControlsRow>
    </>
  );
}
