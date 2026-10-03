import { HERO_CAPTION } from "@/content/home/hero-caption";
import { HeroLoader } from "./hero-loader";
import { HeroStatic } from "./hero-static";
import { KeyboardHelp } from "./keyboard-help";
import "./ecosystem-graphic.css";

// Server component: the static layer is a complete, working diagram with zero client JavaScript; the
// loader swaps in the interactive twin after idle or on first intent.
export function EcosystemGraphic() {
  return (
    <figure className="eco-figure" data-hero>
      <HeroLoader>
        <HeroStatic />
      </HeroLoader>
      <KeyboardHelp />
      <figcaption className="mx-auto max-w-[34rem] pb-2 text-sm text-fg-muted">
        {HERO_CAPTION.text}
      </figcaption>
    </figure>
  );
}
