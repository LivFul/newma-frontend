import type { CopyBlock } from "../types";

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
  interface: { title: "Interface", descriptor: "People and API" },
  "agentic-compute": { title: "Agentic Compute", descriptor: "Plans screening runs" },
  "scientific-review": { title: "Scientific Review", descriptor: "Scientists decide" },
  "wet-lab": { title: "Wet Lab", descriptor: "Assays and results" },
  "data-knowledge": { title: "Data & Knowledge", descriptor: "Authoritative records" },
  "provenance-dlt": { title: "Provenance & DLT", descriptor: "Optional ledger layer" },
});

/** Two faces of the Interface, drawn as the input column outside the AI core (claim C-40, C-48). */
export const HERO_INTERFACE_FACES = Object.freeze({
  people: Object.freeze({ title: "People", descriptor: "Where people sign in" }),
  apps: Object.freeze({ title: "API", descriptor: "MCP for other applications" }),
});

export type SourceDoc = "TA" | "ARCH" | "PRD";
// Closed set of three internal proposals, cited by title and section (assumption A-P4-09).
// Publishing these titles is a CP-2 approval item.
export const SOURCE_TITLES: Readonly<Record<SourceDoc, string>> = Object.freeze({
  TA: "NEWMA Technology Architecture and Workflows",
  ARCH: "NEWMA technological architecture and technology stack",
  PRD: "NEWMA Product Requirements Document v1.0",
});
export type Source = Readonly<{ doc: SourceDoc; section: string }>;
export const sourceLabel = (source: Source): string =>
  `${SOURCE_TITLES[source.doc]} \u00a7 ${source.section}`;

// The six deep routes of the demo, as plain string hrefs: the homepage never imports demo code.
export type DemoHref =
  | "/demo"
  | "/demo/w3-agent"
  | "/demo/w4-gates"
  | "/demo/w5-wet-lab"
  | "/demo/w2-evidence"
  | "/demo/w6-provenance";

export type DemoLink = Readonly<{
  href: DemoHref;
  /** Dashboard title of the workflow that shows this component (claim C-47). */
  workflow: string;
  /** Verbatim prompt 3.1 labels used for this component in the demo (claim C-47). */
  labels: readonly string[];
}>;

export type EcosystemEntry = Readonly<{
  slug: EcosystemSlug;
  title: string;
  /** One paragraph; its leading sentences are the meta description. */
  summary: string;
  /** One-sentence "how it fits the platform". */
  fit: string;
  descriptor: string;
  sources: readonly Source[];
  demo: DemoLink;
  claims: readonly string[];
  callout?: CopyBlock;
}>;

const entry = (value: Omit<EcosystemEntry, "title" | "descriptor">): EcosystemEntry =>
  Object.freeze({
    ...value,
    title: HERO_LABELS[value.slug].title,
    descriptor: HERO_LABELS[value.slug].descriptor,
    sources: Object.freeze(value.sources.map((s) => Object.freeze(s))),
    demo: Object.freeze({ ...value.demo, labels: Object.freeze([...value.demo.labels]) }),
    claims: Object.freeze(
      value.demo.labels.length > 0 ? [...value.claims, "C-47"] : [...value.claims],
    ),
  });

export const ECOSYSTEM: Readonly<Record<EcosystemSlug, EcosystemEntry>> = Object.freeze({
  interface: entry({
    slug: "interface",
    summary:
      "The Interface is the proposed web application through which scientists, biopharma partners and rights custodians reach NEWMA, each through a separate interface. Identity and rights policy are designed to be checked first.",
    fit: "Every request from the Interface is designed to pass an API layer that checks identity, permissions and rights policy before any other component acts.",
    sources: [
      { doc: "TA", section: "1" },
      { doc: "ARCH", section: "2A" },
    ],
    demo: { href: "/demo", workflow: "Demo dashboard", labels: ["Demo sign-in"] },
    claims: ["C-40"],
  }),
  "agentic-compute": entry({
    slug: "agentic-compute",
    summary:
      "Agentic Compute is designed to turn a scientist's query into ranked hypotheses: an agent loads qualified procedures, checks rights and requests screening. Outputs stay hypotheses.",
    fit: "It is designed to receive requests from the Interface and pass reviewable computational evidence to Scientific Review; it never approves advancement.",
    sources: [
      { doc: "TA", section: "2" },
      { doc: "ARCH", section: "2B" },
      { doc: "ARCH", section: "2C" },
    ],
    demo: {
      href: "/demo/w3-agent",
      workflow: "Agentic discovery",
      labels: ["Simulated agent", "Simulated workflow engine", "Simulated compute"],
    },
    claims: ["C-41"],
  }),
  "scientific-review": entry({
    slug: "scientific-review",
    summary:
      "Scientific Review is where scientists, not software, are designed to decide: they approve or revise experimental work and accept or reject evidence.",
    fit: "It is designed to sit between computation and the laboratory and to gate every step toward a confirmed hit with independent mandatory conditions.",
    sources: [
      { doc: "TA", section: "2" },
      { doc: "TA", section: "3" },
      { doc: "PRD", section: "3.3" },
    ],
    demo: {
      href: "/demo/w4-gates",
      workflow: "Scientific review & gates",
      labels: ["Demo signature, not production key"],
    },
    claims: ["C-42"],
  }),
  "wet-lab": entry({
    slug: "wet-lab",
    summary:
      "Wet Lab is designed to close the loop: approved assay requests reach the laboratory through an eLabFTW adapter, and results return to scientists for review.",
    fit: "Results are designed to flow back to Scientific Review, and only observations a scientist accepts become evidence that updates later prioritization.",
    sources: [
      { doc: "TA", section: "3" },
      { doc: "ARCH", section: "2D" },
      { doc: "PRD", section: "3.3" },
    ],
    demo: { href: "/demo/w5-wet-lab", workflow: "Closed-loop wet lab", labels: ["Mock ELN"] },
    claims: ["C-43"],
  }),
  "data-knowledge": entry({
    slug: "data-knowledge",
    summary:
      "Data & Knowledge is designed to hold the authoritative records in a relational database and encrypted object storage, with derived search and graph views.",
    fit: "Every other component is designed to read and write through it, and it keeps each record linked from its botanical source to the assay observation.",
    sources: [
      { doc: "TA", section: "1" },
      { doc: "ARCH", section: "2E" },
      { doc: "PRD", section: "3.5" },
    ],
    demo: { href: "/demo/w2-evidence", workflow: "Ingestion & curation", labels: [] },
    claims: ["C-44"],
  }),
  "provenance-dlt": entry({
    slug: "provenance-dlt",
    summary:
      "Provenance & DLT is designed to record who decided what and when through signed, versioned manifests, with a permissioned ledger as an optional extension. Records stay off-chain.",
    fit: "It is optional: the signed-log baseline comes first, and ledger, scoped proofs and settlement contracts are added only for a defined need.",
    sources: [
      { doc: "TA", section: "4" },
      { doc: "ARCH", section: "2F" },
      { doc: "PRD", section: "3.4" },
    ],
    demo: {
      href: "/demo/w6-provenance",
      workflow: "Signed provenance",
      labels: ["Optional, simulated"],
    },
    claims: ["C-45", "C-46"],
    callout: Object.freeze({
      id: "ecosystem.provenance-dlt.callout",
      text: "This component is optional. Records stay off-chain. In the demo it is labelled Optional, simulated.",
      claims: Object.freeze(["C-46", "C-47"]),
    }),
  }),
});

const SENTENCE_END = /[.!?](?=\s|$)/g;
const MAX_DESCRIPTION_LENGTH = 160;

/** Leading sentences of the summary, cut at a sentence boundary within 160 characters. */
export function metaDescription(summary: string): string {
  let best = "";
  for (const match of summary.matchAll(SENTENCE_END)) {
    const candidate = summary.slice(0, (match.index ?? 0) + 1);
    if (candidate.length > MAX_DESCRIPTION_LENGTH) break;
    best = candidate;
  }
  if (best) return best;
  // No sentence ends inside the budget: cut at a word boundary rather than return nothing.
  const cut = summary.slice(0, MAX_DESCRIPTION_LENGTH - 1).replace(/\s+\S*$/, "");
  return `${cut}\u2026`;
}

export const HERO_CLAIMS: readonly string[] = Object.freeze(["C-48"]);

// Accessible name of a hero link: starts with the visible label (WCAG 2.5.3) and says where it goes.
export function heroAriaLabel(slug: EcosystemSlug): string {
  const { title, descriptor } = HERO_LABELS[slug];
  return `${title}. ${descriptor}. Opens the ${title} page.`;
}

export function ecosystemHref(slug: EcosystemSlug): string {
  return `/ecosystem/${slug}`;
}
