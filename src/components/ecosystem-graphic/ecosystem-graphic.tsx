import { HeroLoader } from "./hero-loader";
import { HeroStatic } from "./hero-static";
import "./ecosystem-graphic.css";

export function EcosystemGraphic() {
  return (
    <figure className="eco-figure" data-hero>
      <HeroLoader>
        <HeroStatic />
      </HeroLoader>
    </figure>
  );
}
