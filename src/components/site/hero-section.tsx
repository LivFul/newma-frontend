import { LeafIcon } from "@/components/brand/leaf-icon";
import { PillIcon } from "@/components/brand/pill-icon";
import { Button } from "@/components/ui/button";
import { EcosystemGraphic } from "@/components/ecosystem-graphic/ecosystem-graphic";
import { HERO } from "@/content/home/copy";
import { AccessLink } from "./access-link";

export function HeroSection() {
  return (
    <section id="hero" aria-labelledby="hero-heading" className="relative overflow-hidden">
      <div className="aurora botanical-lines absolute inset-0 -z-10" aria-hidden="true" />
      {/* Decorative photography sits under the aurora so type stays the LCP node. */}
      <div
        className="pointer-events-none absolute inset-y-0 right-0 -z-10 hidden w-[48%] bg-cover bg-center opacity-40 lg:block"
        style={{
          backgroundImage:
            'image-set(url("/images/hero-botanical.webp") type("image/webp"), url("/images/hero-botanical.jpg") type("image/jpeg"))',
        }}
        aria-hidden="true"
      />
      <div className="grid lg:grid-cols-12">
        <div className="flex flex-col justify-center gap-7 px-5 pt-12 pb-8 md:px-12 md:py-20 lg:col-span-6">
          <h1
            id="hero-heading"
            className="font-display text-display leading-[0.98] font-medium tracking-display text-balance [overflow-wrap:anywhere]"
          >
            {HERO.title.text}
          </h1>
          <p className="max-w-[46ch] text-lg leading-relaxed text-fg-muted">{HERO.lede.text}</p>
          <div className="flex flex-wrap items-center gap-3">
            <AccessLink variant="primary" size="lg" className="min-h-12">
              {HERO.demoCta.text}
            </AccessLink>
            <Button asChild variant="secondary" size="lg" className="min-h-12">
              <a href="#product">{HERO.howCta.text}</a>
            </Button>
          </div>
          <p className="max-w-[52ch] text-base leading-relaxed text-fg-muted">
            {HERO.disclaimer.text}
          </p>
          <div className="flex items-center gap-3 pt-2" aria-hidden="true">
            <LeafIcon className="h-8 w-auto" />
            <PillIcon className="h-8 w-auto" />
          </div>
        </div>
        <div className="relative px-4 pt-4 pb-8 sm:px-8 lg:col-span-6 lg:px-10 lg:pt-16">
          <div className="glass px-3 pt-6 pb-4">
            <EcosystemGraphic />
          </div>
        </div>
      </div>
    </section>
  );
}
