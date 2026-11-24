import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EcosystemGraphic } from "@/components/ecosystem-graphic/ecosystem-graphic";
import { HERO } from "@/content/home/copy";
import { AVELOZ_LINK, HERO_MIRROR_LINKS } from "@/content/home/chrome";
import { AccessLink } from "./access-link";
import { heroEntrance } from "./type";

/**
 * Brand guide v1 hero: the serif headline sits on a translucent glass plate, the bitmap wave behind
 * it, and a forest photo on the right carrying the ecosystem diagram on a free-form (fog) card.
 */
export function HeroSection() {
  return (
    <section id="hero" aria-labelledby="hero-heading" className="relative isolate overflow-hidden">
      <div className="aurora absolute inset-0 -z-20" aria-hidden="true" />
      <div
        className="hero-photo pointer-events-none absolute inset-y-0 right-0 -z-10 hidden w-[48%] bg-cover bg-center lg:block"
        style={{
          backgroundImage:
            'image-set(url("/images/hero-botanical.webp") type("image/webp"), url("/images/hero-botanical.jpg") type("image/jpeg"))',
        }}
        aria-hidden="true"
      />
      <div
        className="hero-stage pointer-events-none absolute inset-y-0 right-0 -z-10 hidden w-[48%] lg:block"
        aria-hidden="true"
      />
      {/* The guide's bitmap wave, dissolving left to right behind the headline. */}
      <div className="bitmap-wave pointer-events-none absolute -z-10" aria-hidden="true" />
      <div className="mx-auto grid min-h-[calc(100dvh-var(--size-header))] w-full max-w-[86rem] items-center gap-8 px-5 py-12 md:px-12 lg:grid-cols-12 lg:gap-6 lg:py-16">
        <div className="flex flex-col gap-6 lg:col-span-6">
          <div className="flex flex-col gap-3">
            <h1
              id="hero-heading"
              className="hero-title glass font-display text-display leading-[1.04] font-normal tracking-display text-balance text-accent [overflow-wrap:anywhere]"
            >
              <span className="sr-only">{HERO.title.text}: </span>
              {HERO.tagline.text}
            </h1>
            <p className="max-w-[48ch] px-[1.05rem] text-base leading-normal text-fg-muted">
              {HERO.lede.text}
            </p>
            <div
              className={`${heroEntrance(0)} flex flex-wrap items-center gap-3 px-[1.05rem]`}
              data-hero-actions
            >
              <AccessLink variant="primary" size="md" className="min-h-11 max-w-full">
                {HERO_MIRROR_LINKS.platform.text}
              </AccessLink>
              <Button asChild variant="sage" size="md" className="min-h-11 max-w-full">
                <a
                  href={AVELOZ_LINK.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-describedby="aveloz-new-tab"
                >
                  {HERO_MIRROR_LINKS.aveloz.text}
                </a>
              </Button>
              <span id="aveloz-new-tab" className="sr-only">
                {AVELOZ_LINK.newTab.text}
              </span>
              <Button asChild variant="sage-soft" size="md" className="min-h-11 max-w-full">
                <Link href="/how-it-works">{HERO_MIRROR_LINKS.how.text}</Link>
              </Button>
            </div>
          </div>
          <p
            className={`${heroEntrance(1)} max-w-[60ch] px-[1.05rem] text-sm leading-relaxed text-fg-muted`}
          >
            {HERO.disclaimer.text}
          </p>
        </div>
        <div className="hero-eco relative lg:col-span-6 lg:pl-6">
          <div className="fog-panel plate-surface relative isolate overflow-clip rounded-[2rem] px-5 pt-6 sm:px-8">
            <EcosystemGraphic />
          </div>
        </div>
      </div>
    </section>
  );
}
