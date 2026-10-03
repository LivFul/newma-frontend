// Order is the DOM order, the Tab order and the top-to-bottom order of the hero graphic.
export const ECOSYSTEM_SLUGS = [
  "interface",
  "agentic-compute",
  "scientific-review",
  "wet-lab",
  "data-knowledge",
  "provenance-dlt",
] as const;

export type EcosystemSlug = (typeof ECOSYSTEM_SLUGS)[number];

export function isEcosystemSlug(value: string): value is EcosystemSlug {
  return (ECOSYSTEM_SLUGS as readonly string[]).includes(value);
}

export type HeroLabel = { readonly title: string; readonly descriptor: string };

// Titles and one-line descriptors (claim C-48). Descriptors stay short so they fit the label column
// of the graphic at a legible size, and none implies a deployed ledger.
export const HERO_LABELS: Readonly<Record<EcosystemSlug, HeroLabel>> = Object.freeze({
  interface: { title: "Interface", descriptor: "Where people sign in" },
  "agentic-compute": { title: "Agentic Compute", descriptor: "Plans screening runs" },
  "scientific-review": { title: "Scientific Review", descriptor: "Scientists decide" },
  "wet-lab": { title: "Wet Lab", descriptor: "Assays and results" },
  "data-knowledge": { title: "Data & Knowledge", descriptor: "Authoritative records" },
  "provenance-dlt": { title: "Provenance & DLT", descriptor: "Optional ledger layer" },
});

export const HERO_CLAIMS: readonly string[] = Object.freeze(["C-48"]);

// Accessible name of a hero link: starts with the visible label (WCAG 2.5.3) and says where it goes.
export function heroAriaLabel(slug: EcosystemSlug): string {
  const { title, descriptor } = HERO_LABELS[slug];
  return `${title}. ${descriptor}. Opens the ${title} page.`;
}

export function ecosystemHref(slug: EcosystemSlug): string {
  return `/ecosystem/${slug}`;
}
