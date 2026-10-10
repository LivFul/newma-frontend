import type { CopyBlock } from "../types";

// Homepage copy (D-06). Updated from NEWMA_Website_Content_Consolidated.md.
const block = (id: string, text: string, claims: readonly string[] = []): CopyBlock =>
  Object.freeze({ id, text, claims: Object.freeze([...claims]) });

export const HERO = Object.freeze({
  title: block("home.hero.title", "NEWMA", ["C-20"]),
  tagline: block("home.hero.tagline", "Ethnobotanical drug discovery, guided by evidence.", [
    "C-20",
  ]),
  lede: block(
    "home.hero.lede",
    "We are building a platform that connects authorized medicinal plant knowledge with computational research and laboratory testing. NEWMA is designed to help scientists decide what to test next while preserving attribution, confidentiality and benefit-sharing obligations.",
    ["C-20"],
  ),
  disclaimer: block(
    "home.hero.disclaimer",
    "NEWMA is in development. This demo uses synthetic data to illustrate the proposed workflow; it does not establish scientific performance, production readiness or regulatory compliance.",
    ["C-21"],
  ),
  demoCta: block("home.hero.cta.demo", "Explore the Platform", ["C-21"]),
  howCta: block("home.hero.cta.how", "How it works"),
});

export const PRODUCT = Object.freeze({
  heading: block(
    "home.product.heading",
    "Connecting knowledge, chemistry and experimental evidence",
    ["C-22"],
  ),
  what: block(
    "home.product.what",
    "NEWMA is a discovery platform in development that brings computational research and laboratory evidence into one traceable research process.",
    ["C-22"],
  ),
  whatDetail: block(
    "home.product.whatDetail",
    "It is designed to connect the source of a research idea, the identity of the material, the rationale for testing it and the evidence needed to decide what happens next. Its initial discovery scope extends from an authorized research question to the assessment of potential early leads.",
    ["C-22"],
  ),
  problemHeading: block("home.product.problem.heading", "The problem we address", ["C-23"]),
  problem: block(
    "home.product.problem",
    "Medicinal plant knowledge can help researchers choose where to begin. Moving from a documented use to a testable hypothesis, however, requires reliable connections between knowledge, plant identity, chemical composition and biological results. Traditional use alone does not establish efficacy or safety.",
    ["C-23"],
  ),
  problemDetail: block(
    "home.product.problemDetail",
    "When these connections are missing, ideas become difficult to evaluate and reproduce. Attribution and conditions of use can also become separated from the research they inform.",
    ["C-23"],
  ),
  problemSolution: block(
    "home.product.problemSolution",
    "NEWMA is being designed to keep these connections visible, helping teams prioritize experiments and review the evidence and permissions behind each decision.",
    ["C-23"],
  ),
  howHeading: block("home.product.how.heading", "How it works"),
  guardrail: block(
    "home.product.guardrail",
    "Predictions guide experiments. Scientific evidence determines advancement.",
    ["C-24"],
  ),
  demoCta: block("home.product.cta.demo", "Explore the Platform", ["C-21"]),
  personasHeading: block("home.product.personas.heading", "Who it is for"),
  supportingRoles: block(
    "home.product.personas.supporting",
    "Designed for collaboration across scientific, data stewardship, legal and community governance teams.",
    ["C-25"],
  ),
});

export const COMPONENTS_INDEX = Object.freeze({
  listLabel: block("home.components.list", "Component pages", ["C-48"]),
  heading: block("home.components.heading", "One connected discovery ecosystem", ["C-48"]),
  intro: block(
    "home.components.intro",
    "Six components are designed to connect research questions, computational work, laboratory evidence and accountable decisions.",
    ["C-48"],
  ),
  diagramHeading: block("home.components.diagram.heading", "One system, six components", ["C-48"]),
  diagramIntro: block(
    "home.components.diagram.intro",
    "NEWMA is designed as six connected layers that support discovery, review and record keeping.",
    ["C-48"],
  ),
  diagramCaption: block(
    "home.components.diagram.caption",
    "Six proposed components connect authorized research requests with computational hypotheses, scientific review, experimental results and traceable records.",
    ["C-48"],
  ),
  diagramAlt: block(
    "home.components.diagram.alt",
    "Interface provides the research workspace. Agentic Compute coordinates authorized computational work. Scientific Review governs experiment approval and observation acceptance. Wet Lab connects approved assays with experimental results. Data & Knowledge maintains the connected evidence record. Provenance & DLT brings trust and security through record history and ledger verification. These are connected responsibilities, rather than a single sequence of scientific advancement.",
    ["C-48"],
  ),
});

export const CLOSING = Object.freeze({
  heading: block("home.closing.heading", "Explore the NEWMA workflow", ["C-50"]),
  body: block(
    "home.closing.body",
    "See how the proposed platform connects source knowledge, computational hypotheses, laboratory results and scientific review.",
    ["C-50"],
  ),
  demoCta: block("home.closing.cta.demo", "Explore the Platform", ["C-21"]),
});

export const MARKETING_PAGES = Object.freeze({
  overview: Object.freeze({
    title: block("pages.overview.title", "Overview — NEWMA", ["C-50"]),
    description: block(
      "pages.overview.description",
      "Learn what NEWMA connects, the problem it addresses, and who the platform is designed for in ethnobotanical drug discovery.",
      ["C-50"],
    ),
  }),
  howItWorks: Object.freeze({
    title: block("pages.how.title", "How it works — NEWMA", ["C-50"]),
    description: block(
      "pages.how.description",
      "Follow NEWMA from research question to reviewed evidence: a short workflow summary and the full scientific evidence diagram.",
      ["C-50"],
    ),
  }),
  ecosystem: Object.freeze({
    title: block("pages.ecosystem.title", "Ecosystem — NEWMA", ["C-50"]),
    description: block(
      "pages.ecosystem.description",
      "Explore the six connected NEWMA components that link research questions, computational work, laboratory evidence and accountable decisions.",
      ["C-50"],
    ),
  }),
  about: Object.freeze({
    title: block("pages.about.title", "About Newma — NEWMA", ["C-50"]),
    description: block(
      "pages.about.description",
      "NEWMA's purpose, mission, vision and approach to connecting authorized botanical knowledge with computational and laboratory evidence.",
      ["C-50"],
    ),
  }),
});

export const ABOUT = Object.freeze({
  heading: block("home.about.heading", "About Newma"),
  subheading: block("home.about.subheading", "Discovery with health access in mind", ["C-26"]),
});

export const HOME_META = Object.freeze({
  defaultDescription: block(
    "home.meta.default",
    "Explore NEWMA, a platform in development connecting authorized medicinal plant knowledge, computational research and laboratory evidence for drug discovery.",
    ["C-50"],
  ),
  title: block("home.meta.title", "NEWMA | Ethnobotanical Drug Discovery by LivFul", ["C-50"]),
  ogAlt: block(
    "home.meta.ogalt",
    "NEWMA, a platform in development for ethnobotanical drug discovery",
    ["C-50"],
  ),
  description: block(
    "home.meta.description",
    "Explore NEWMA, a platform in development connecting authorized medicinal plant knowledge, computational research and laboratory evidence for drug discovery.",
    ["C-50"],
  ),
});

export const OFFLINE = Object.freeze({
  title: block("home.offline.title", "You are offline"),
  body: block(
    "home.offline.body",
    "NEWMA cannot reach the network right now. Reconnect to continue, or return to the last page you visited.",
    ["C-56"],
  ),
});
