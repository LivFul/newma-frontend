import { HERO_CAPTION, HERO_MAP_LEGEND } from "@/content/home/hero-caption";
import { HeroLoader } from "./hero-loader";
import { HeroStatic } from "./hero-static";
import "./ecosystem-graphic.css";

export function EcosystemGraphic() {
  return (
    <figure className="eco-figure" data-hero>
      <HeroLoader>
        <HeroStatic />
      </HeroLoader>
      <figcaption className="mx-auto max-w-[34rem] space-y-2 pb-2 text-sm text-fg-muted">
        <p>{HERO_CAPTION.text}</p>
        <p className="text-xs">{HERO_MAP_LEGEND.text}</p>
      </figcaption>
    </figure>
  );
}
