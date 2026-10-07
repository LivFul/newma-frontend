import type { CopyBlock } from "../types";

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

export const HERO_LABELS: Readonly<Record<EcosystemSlug, HeroLabel>> = Object.freeze({
  interface: { title: "Interface", descriptor: "Research workspace" },
  "agentic-compute": { title: "Agentic Compute", descriptor: "Computational prioritization" },
  "scientific-review": { title: "Scientific Review", descriptor: "Scientist-led decisions" },
  "wet-lab": { title: "Wet Lab", descriptor: "Experimental validation" },
  "data-knowledge": { title: "Data & Knowledge", descriptor: "Connected evidence" },
  "provenance-dlt": { title: "Provenance & DLT", descriptor: "Record history and verification" },
});

export const HERO_INTERFACE_FACES = Object.freeze({
  people: Object.freeze({ title: "People", descriptor: "Where people sign in" }),
  apps: Object.freeze({ title: "API", descriptor: "MCP for other applications" }),
});

export type SourceDoc = "TA" | "ARCH" | "PRD";
export const SOURCE_TITLES: Readonly<Record<SourceDoc, string>> = Object.freeze({
  TA: "NEWMA Technology Architecture and Workflows",
  ARCH: "NEWMA technological architecture and technology stack",
  PRD: "NEWMA Product Requirements Document v1.0",
});
export type Source = Readonly<{ doc: SourceDoc; section: string }>;
export const sourceLabel = (source: Source): string =>
  `${SOURCE_TITLES[source.doc]} \u00a7 ${source.section}`;

export type DemoHref =
  | "/demo"
  | "/demo/w3-agent"
  | "/demo/w4-gates"
  | "/demo/w5-wet-lab"
  | "/demo/w2-evidence"
  | "/demo/w6-provenance";

export type DemoLink = Readonly<{
  href: DemoHref;
  workflow: string;
  labels: readonly string[];
}>;

const fn = (id: string, text: string, claims: readonly string[]): CopyBlock =>
  Object.freeze({ id, text, claims: Object.freeze([...claims]) });

export type EcosystemEntry = Readonly<{
  slug: EcosystemSlug;
  title: string;
  headline: string;
  summary: string;
  summaryDetail?: string;
  homeSummary: string;
  fit: string;
  descriptor: string;
  designedFunctions: readonly CopyBlock[];
  handoff: CopyBlock;
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
    designedFunctions: Object.freeze([...value.designedFunctions]),
    claims: Object.freeze(
      value.demo.labels.length > 0 ? [...value.claims, "C-47"] : [...value.claims],
    ),
  });

export const ECOSYSTEM: Readonly<Record<EcosystemSlug, EcosystemEntry>> = Object.freeze({
  interface: entry({
    slug: "interface",
    headline: "One place to ask, review and decide.",
    summary:
      "The Interface is designed as a shared workspace for scientists, biopharma partners, authorized community representatives and reviewers with governed access.",
    summaryDetail:
      "Research questions, findings and decisions should appear alongside their rights, limitations and status, so a ranking can be considered in its proper context.",
    homeSummary:
      "Define research questions, review findings and collaborate within your project\u2019s authorized access.",
    fit: "Every request from the Interface is designed to pass an API layer that checks identity, permissions and rights policy before any other component acts.",
    sources: [
      { doc: "TA", section: "1" },
      { doc: "ARCH", section: "2A" },
    ],
    designedFunctions: Object.freeze([
      fn(
        "ecosystem.interface.fn.submit",
        "Submit research questions, objectives and constraints.",
        ["C-40"],
      ),
      fn(
        "ecosystem.interface.fn.review",
        "Review queries, runs and records within authorized access.",
        ["C-40"],
      ),
      fn(
        "ecosystem.interface.fn.display",
        "Display permitted uses, restrictions and limitations alongside results.",
        ["C-40"],
      ),
      fn(
        "ecosystem.interface.fn.collaborate",
        "Support collaboration and review across project roles.",
        ["C-40"],
      ),
    ]),
    handoff: fn(
      "ecosystem.interface.handoff",
      "Submitted research requests pass to Agentic Compute for authorized computational work.",
      ["C-40"],
    ),
    demo: { href: "/demo", workflow: "Demo dashboard", labels: ["Demo sign-in"] },
    claims: ["C-40"],
  }),
  "agentic-compute": entry({
    slug: "agentic-compute",
    headline: "Rights first, then retrieval, then ranking.",
    summary:
      "Agentic Compute is designed to turn a scientist\u2019s question into a computational plan with access and rights checks before authorized retrieval.",
    summaryDetail:
      "It returns ranked hypotheses with their supporting sources and limitations. Screening workflows are intended to operate within approved methods and budgets, with bounded retries, cancellation and holds. Recording inputs, versions, settings and seeds supports reproducibility and review.",
    homeSummary:
      "Coordinate computational research and screening within approved methods, budgets and permissions. Return ranked hypotheses with supporting sources and uncertainty.",
    fit: "It is designed to receive requests from the Interface and pass reviewable computational evidence to Scientific Review; it never approves advancement.",
    sources: [
      { doc: "TA", section: "2" },
      { doc: "ARCH", section: "2B" },
      { doc: "ARCH", section: "2C" },
    ],
    designedFunctions: Object.freeze([
      fn(
        "ecosystem.agentic.fn.translate",
        "Translate research objectives and constraints into computational work.",
        ["C-41"],
      ),
      fn("ecosystem.agentic.fn.retrieve", "Retrieve information within the permitted scope.", [
        "C-41",
      ]),
      fn(
        "ecosystem.agentic.fn.rank",
        "Rank hypotheses while retaining uncertainty and supporting records.",
        ["C-41"],
      ),
      fn("ecosystem.agentic.fn.record", "Record the inputs and settings used in a run.", ["C-41"]),
      fn("ecosystem.agentic.fn.stop", "Stop or hold work when a budget or rule is reached.", [
        "C-41",
      ]),
    ]),
    handoff: fn(
      "ecosystem.agentic.handoff",
      "Ranked hypotheses pass to Scientific Review for assessment and decisions about experimental testing.",
      ["C-41"],
    ),
    demo: {
      href: "/demo/w3-agent",
      workflow: "Agentic discovery",
      labels: ["Simulated agent", "Simulated workflow engine", "Simulated compute"],
    },
    claims: ["C-41"],
  }),
  "scientific-review": entry({
    slug: "scientific-review",
    headline: "Computation proposes. Scientists decide.",
    summary:
      "Scientific Review is designed to keep people responsible for decisions that require scientific judgment, including experiment approval and evidence acceptance.",
    summaryDetail:
      "Scientists examine computational rankings, approve or amend assay requests and assess returned observations. Computational outputs remain hypotheses. Returned assay data remain available for review, with only accepted observations entering the reviewed evidence base.",
    homeSummary:
      "Keep scientists responsible for experiment approval, evidence acceptance and candidate advancement.",
    fit: "It is designed to sit between computation and the laboratory and to gate every step toward a confirmed hit with independent mandatory conditions.",
    sources: [
      { doc: "TA", section: "2" },
      { doc: "TA", section: "3" },
      { doc: "PRD", section: "3.3" },
    ],
    designedFunctions: Object.freeze([
      fn(
        "ecosystem.review.fn.rationale",
        "Review the rationale and limitations behind candidate rankings.",
        ["C-42"],
      ),
      fn(
        "ecosystem.review.fn.approve",
        "Approve, amend or hold assay requests before laboratory work.",
        ["C-42"],
      ),
      fn("ecosystem.review.fn.examine", "Examine results, controls, uncertainty and deviations.", [
        "C-42",
      ]),
      fn("ecosystem.review.fn.accept", "Accept or reject observations.", ["C-42"]),
      fn(
        "ecosystem.review.fn.advancement",
        "Review the evidence required for candidate advancement.",
        ["C-42"],
      ),
    ]),
    handoff: fn(
      "ecosystem.review.handoff",
      "Approved assay requests pass to Wet Lab. Returned results come back for scientific assessment, and accepted observations pass to Data & Knowledge.",
      ["C-42"],
    ),
    demo: {
      href: "/demo/w4-gates",
      workflow: "Scientific review & gates",
      labels: ["Demo signature, not production key"],
    },
    claims: ["C-42"],
  }),
  "wet-lab": entry({
    slug: "wet-lab",
    headline: "Experiments that answer the question.",
    summary:
      "Wet Lab is designed to connect approved assay requests with laboratory scientists and partners using defined materials, protocols and controls.",
    summaryDetail:
      "Requests specify the endpoints and deliverables needed to test a research hypothesis. Results should return with raw data, replicates and uncertainty, linked to the material and batch that produced them.",
    homeSummary:
      "Connect approved assay requests to materials, protocols, controls and experimental results.",
    fit: "Results are designed to flow back to Scientific Review, and only observations a scientist accepts become evidence that updates later prioritization.",
    sources: [
      { doc: "TA", section: "3" },
      { doc: "ARCH", section: "2D" },
      { doc: "PRD", section: "3.3" },
    ],
    designedFunctions: Object.freeze([
      fn(
        "ecosystem.wetlab.fn.carry",
        "Carry scientist-approved assay requests to laboratory teams.",
        ["C-43"],
      ),
      fn(
        "ecosystem.wetlab.fn.connect",
        "Connect experiments with confirmed material identity and permitted use.",
        ["C-43"],
      ),
      fn(
        "ecosystem.wetlab.fn.return",
        "Return protocols, controls, raw data and relevant uncertainty.",
        ["C-43"],
      ),
      fn("ecosystem.wetlab.fn.preserve", "Preserve sample and batch links for scientific review.", [
        "C-43",
      ]),
    ]),
    handoff: fn(
      "ecosystem.wetlab.handoff",
      "Experimental results return to Scientific Review. Accepted observations and their supporting records pass to Data & Knowledge.",
      ["C-43"],
    ),
    demo: { href: "/demo/w5-wet-lab", workflow: "Closed-loop wet lab", labels: ["Mock ELN"] },
    claims: ["C-43"],
  }),
  "data-knowledge": entry({
    slug: "data-knowledge",
    headline: "One authoritative record, kept off-chain.",
    summary:
      "Data & Knowledge is designed to hold authoritative records linking source knowledge, botanical materials, chemical identities and reviewed observations.",
    summaryDetail:
      "Attribution, confidentiality, access conditions and benefit obligations remain associated with the records they govern. Accepted positive and negative observations can inform later prioritization without automatically authorizing their use in model training.",
    homeSummary:
      "Link authorized source knowledge, botanical materials, chemical identities and reviewed observations in a shared evidence record.",
    fit: "Every other component is designed to read and write through it, and it keeps each record linked from its botanical source to the assay observation.",
    sources: [
      { doc: "TA", section: "1" },
      { doc: "ARCH", section: "2E" },
      { doc: "PRD", section: "3.5" },
    ],
    designedFunctions: Object.freeze([
      fn(
        "ecosystem.data.fn.connect",
        "Connect knowledge, materials, chemistry and experimental records.",
        ["C-44"],
      ),
      fn("ecosystem.data.fn.restrict", "Restrict access to the authorized scope.", ["C-44"]),
      fn(
        "ecosystem.data.fn.preserve",
        "Preserve sources, conditions of use and contribution history.",
        ["C-44"],
      ),
      fn(
        "ecosystem.data.fn.maintain",
        "Maintain reviewed observations and their supporting data.",
        ["C-44"],
      ),
      fn("ecosystem.data.fn.support", "Support subsequent research using accepted findings.", [
        "C-44",
      ]),
    ]),
    handoff: fn(
      "ecosystem.data.handoff",
      "Research records support future authorized work. Their provenance entries connect with Provenance & DLT for record-history verification.",
      ["C-44"],
    ),
    demo: { href: "/demo/w2-evidence", workflow: "Ingestion & curation", labels: [] },
    claims: ["C-44"],
  }),
  "provenance-dlt": entry({
    slug: "provenance-dlt",
    headline: "A record that shows where decisions came from.",
    summary:
      "Provenance & DLT is designed to associate decisions and records with signed, versioned provenance: a documented history of their origin and changes. Authoritative records remain off-chain.",
    summaryDetail:
      "A distributed-ledger layer is an optional extension for anchoring provenance between partners. Agreed benefit obligations stay associated with the relevant records.",
    homeSummary:
      "Track the origin and history of records through signed, versioned provenance. An optional distributed-ledger layer could support verification between partners while authoritative research records remain off-chain.",
    fit: "It is optional: the signed-log baseline comes first, and ledger, scoped proofs and settlement contracts are added only for a defined need.",
    sources: [
      { doc: "TA", section: "4" },
      { doc: "ARCH", section: "2F" },
      { doc: "PRD", section: "3.4" },
    ],
    designedFunctions: Object.freeze([
      fn(
        "ecosystem.provenance.fn.maintain",
        "Maintain signed, versioned provenance for records and decisions.",
        ["C-45"],
      ),
      fn("ecosystem.provenance.fn.review", "Support review of record origins and changes.", [
        "C-45",
      ]),
      fn(
        "ecosystem.provenance.fn.preserve",
        "Preserve links to attribution and agreed benefit obligations.",
        ["C-45"],
      ),
      fn(
        "ecosystem.provenance.fn.anchor",
        "Allow optional ledger anchoring without placing authoritative research records on-chain.",
        ["C-45"],
      ),
    ]),
    handoff: fn(
      "ecosystem.provenance.handoff",
      "A traceable record history supports review by authorized researchers, reviewers and partners.",
      ["C-45"],
    ),
    demo: {
      href: "/demo/w6-provenance",
      workflow: "Signed provenance",
      labels: ["Optional, simulated"],
    },
    claims: ["C-45", "C-46"],
    callout: Object.freeze({
      id: "ecosystem.provenance-dlt.callout",
      text: "Digital verification supports record review; it does not independently establish consent, material identity or scientific validity.",
      claims: Object.freeze(["C-46", "C-47"]),
    }),
  }),
});

const SENTENCE_END = /[.!?](?=\s|$)/g;
const MAX_DESCRIPTION_LENGTH = 160;

export function metaDescription(summary: string): string {
  let best = "";
  for (const match of summary.matchAll(SENTENCE_END)) {
    const candidate = summary.slice(0, (match.index ?? 0) + 1);
    if (candidate.length > MAX_DESCRIPTION_LENGTH) break;
    best = candidate;
  }
  if (best) return best;
  const cut = summary.slice(0, MAX_DESCRIPTION_LENGTH - 1).replace(/\s+\S*$/, "");
  return `${cut}\u2026`;
}

export const HERO_CLAIMS: readonly string[] = Object.freeze(["C-48"]);

export function heroAriaLabel(slug: EcosystemSlug): string {
  const { title, descriptor } = HERO_LABELS[slug];
  return `${title}. ${descriptor}. Opens the ${title} page.`;
}

export function ecosystemHref(slug: EcosystemSlug): string {
  return `/ecosystem/${slug}`;
}

export const ECOSYSTEM_MAP_KEY = Object.freeze([
  Object.freeze({
    label: "Discovery pathway",
    text: "The path from authorized plant knowledge to a scientist-reviewed result.",
  }),
  Object.freeze({
    label: "Contours",
    text: "The proposed layers that support a research request.",
  }),
  Object.freeze({
    label: "Restricted knowledge or material",
    text: "Information or materials outside the authorized scope. The platform is designed to restrict access to that scope.",
  }),
]);
