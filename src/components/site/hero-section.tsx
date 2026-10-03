import { Button } from "@/components/ui/button";
import { EcosystemGraphic } from "@/components/ecosystem-graphic/ecosystem-graphic";
import { HERO } from "@/content/home/copy";
import { AccessLink } from "./access-link";

// The H1 and lede are plain server HTML above the graphic, so LCP is text and never a JS-rendered node.
export function HeroSection() {
  return (
    <section
      id="hero"
      aria-labelledby="hero-heading"
      className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-[minmax(0,1fr)_minmax(0,34rem)] md:items-center md:gap-12 md:px-8 md:py-16"
    >
      <div className="space-y-6">
        <h1
          id="hero-heading"
          className="font-display text-display leading-[1.05] tracking-display text-balance"
        >
          {HERO.title.text}
        </h1>
        <p className="max-w-[58ch] text-lg text-fg-muted">{HERO.lede.text}</p>
        <div className="flex flex-wrap items-center gap-3">
          <AccessLink variant="primary" size="lg" className="min-h-11">
            {HERO.demoCta.text}
          </AccessLink>
          <Button asChild variant="secondary" size="lg" className="min-h-11">
            <a href="#product">{HERO.howCta.text}</a>
          </Button>
        </div>
        <p className="max-w-[58ch] text-sm text-fg-muted">{HERO.disclaimer.text}</p>
      </div>
      <EcosystemGraphic />
    </section>
  );
}
