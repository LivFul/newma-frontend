import { Button } from "@/components/ui/button";
import { EcosystemGraphic } from "@/components/ecosystem-graphic/ecosystem-graphic";
import { HERO } from "@/content/home/copy";
import { AccessLink } from "./access-link";
import { heroEntrance } from "./type";

export function HeroSection() {
  return (
    <section id="hero" aria-labelledby="hero-heading" className="relative overflow-hidden">
      <div className="aurora botanical-lines absolute inset-0 -z-10" aria-hidden="true" />
      <div
        className="hero-photo pointer-events-none absolute inset-y-0 right-0 -z-10 hidden w-[48%] bg-cover bg-center opacity-40 lg:block"
        style={{
          backgroundImage:
            'image-set(url("/images/hero-botanical.webp") type("image/webp"), url("/images/hero-botanical.jpg") type("image/jpeg"))',
        }}
        aria-hidden="true"
      />
      <div className="grid min-h-[calc(100dvh-var(--size-header))] items-center lg:grid-cols-12">
        <div className="flex flex-col justify-center gap-10 px-5 py-16 md:px-12 md:py-20 lg:col-span-6">
          <h1
            id="hero-heading"
            className="font-display text-display leading-[0.98] font-medium tracking-display text-balance [overflow-wrap:anywhere]"
          >
            {HERO.title.text}
          </h1>
          <div className="flex flex-col gap-4">
            <p
              className={`${heroEntrance(1)} max-w-[46ch] text-xl font-medium leading-snug tracking-[-0.01em]`}
            >
              {HERO.tagline.text}
            </p>
            <p className={`${heroEntrance(2)} max-w-[46ch] text-lg leading-relaxed text-fg-muted`}>
              {HERO.lede.text}
            </p>
          </div>
          <div className="flex flex-col gap-5">
            <div className={`${heroEntrance(3)} flex flex-wrap items-center gap-3`}>
              <AccessLink variant="primary" size="lg" className="min-h-12">
                {HERO.demoCta.text}
              </AccessLink>
              <Button asChild variant="secondary" size="lg" className="min-h-12">
                <a href="#workflow">{HERO.howCta.text}</a>
              </Button>
            </div>
            <p className={`${heroEntrance(4)} max-w-[52ch] text-sm leading-relaxed text-fg-muted`}>
              {HERO.disclaimer.text}
            </p>
          </div>
        </div>
        <div className="relative px-5 py-8 md:px-12 lg:col-span-6">
          <div
            className="hero-stage absolute inset-x-8 inset-y-4 hidden lg:block"
            aria-hidden="true"
          />
          <div className="relative">
            <EcosystemGraphic />
          </div>
        </div>
      </div>
    </section>
  );
}
