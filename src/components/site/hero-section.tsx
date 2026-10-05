import { Button } from "@/components/ui/button";
import { EcosystemGraphic } from "@/components/ecosystem-graphic/ecosystem-graphic";
import { HERO } from "@/content/home/copy";
import { SURVEY_LABELS } from "@/content/home/survey";
import { AccessLink } from "./access-link";
import { SurveyTerrain } from "./survey-terrain";
import "./survey-sheet.css";

const COLUMNS = Array.from({ length: 8 }, (_, i) => String.fromCharCode(65 + i));
const ROWS = Array.from({ length: 5 }, (_, i) => String(i + 1));

// Grid references printed inside the neatline, as on a survey sheet. Decorative.
function GridTicks() {
  return (
    <>
      <div aria-hidden="true" className="sheet-ticks-x gridref">
        {COLUMNS.map((c) => (
          <span key={c}>{c}</span>
        ))}
      </div>
      <div aria-hidden="true" className="sheet-ticks-y gridref">
        {ROWS.map((r) => (
          <span key={r}>{r}</span>
        ))}
      </div>
    </>
  );
}

function MapKey() {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-fg px-5 py-4 text-sm md:px-10">
      <p className="gridref text-fg">{SURVEY_LABELS.sheetRef.text}</p>
      <p className="place text-fg">{SURVEY_LABELS.legendHeading.text}</p>
      <ul role="list" className="flex flex-wrap items-center gap-x-6 gap-y-2 text-fg-muted">
        {/* Each swatch sits on a chip of the dark plate, drawn exactly as the map draws it. */}
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="plate-surface sheet-key-chip">
            <span className="sheet-key-swatch sheet-key-route" />
          </span>
          {SURVEY_LABELS.route.text}
        </li>
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="plate-surface sheet-key-chip">
            <span className="sheet-key-swatch sheet-key-contour" />
          </span>
          {SURVEY_LABELS.contours.text}
        </li>
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="plate-surface sheet-key-chip">
            <span className="sheet-key-swatch sheet-key-restricted hatch-restricted" />
          </span>
          {SURVEY_LABELS.restricted.text}
        </li>
      </ul>
      <p className="ml-auto flex items-center gap-3 text-fg-muted">
        <span aria-hidden="true" className="sheet-scale">
          <span />
          <span />
          <span />
          <span />
        </span>
        <span className="gridref">{SURVEY_LABELS.scale.text}</span>
      </p>
    </div>
  );
}

// The H1 and lede are plain server HTML in the title block, so LCP is text and never a JS-rendered
// node. The terrain is static SVG; only the ecosystem plates hydrate, as before.
export function HeroSection() {
  return (
    <section id="hero" aria-labelledby="hero-heading">
      <div className="sheet w-full">
        <GridTicks />
        <div className="grid lg:grid-cols-12">
          <div className="flex flex-col justify-center gap-7 px-5 pt-12 pb-8 md:px-10 md:py-16 lg:col-span-6 lg:pl-14">
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
            <p className="gridref max-w-[52ch] leading-relaxed text-fg-muted">
              {HERO.disclaimer.text}
            </p>
          </div>
          <div className="plate-surface relative px-1 pt-6 pb-4 [contain:paint] sm:px-5 lg:col-span-6 lg:px-8 lg:pt-14">
            <div className="survey-stage">
              <div className="survey-ground">
                <SurveyTerrain />
              </div>
              <EcosystemGraphic />
            </div>
          </div>
        </div>
        <MapKey />
      </div>
    </section>
  );
}
